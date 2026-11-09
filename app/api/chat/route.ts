import { loadChatMessages, saveChatMessages } from "@/features/ai/actions/chat-store";
import { getFriendlyAIErrorMessage } from "@/features/ai/utils/error-message";
import { getChatModel } from "@/features/ai/utils/model";
import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { convertToModelMessages, createIdGenerator, createUIMessageStream, createUIMessageStreamResponse, streamText, toUIMessageStream, type UIMessage } from "ai";
/**
 * POST /api/chat — Streams an AI assistant reply for a conversation.
 *
 * Validates auth and ownership, persists the user message, then streams the
 * assistant response via the AI SDK. Final messages are saved when the stream ends.
 */
export async function POST(req: Request) {
    await auth.protect();

    const { message, id }: { message: UIMessage, id: string } = await req.json();

    if (!message || !id) {
        return new Response("Missing message or conversation id", { status: 400 });
    }

    const user = await requireUser();

    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            userId: user.id
        }
    });

    if (!conversation) {
        return new Response("Conversation not found", { status: 404 });
    }

    const previousMessages = await loadChatMessages(id);

    const alreadySaved = previousMessages.some(
        (storedMessage)=>storedMessage.id === message.id
    )

    const messages = alreadySaved ? previousMessages : [...previousMessages, message];

    if(!alreadySaved){
        await saveChatMessages(id, [message]);
    }

    const result =  streamText({
        model: getChatModel(conversation.model),
        system: conversation.systemPrompt ?? "You are Thinkora, a helpful assistant",
        messages: await convertToModelMessages(messages),
    });

    result.consumeStream();

    return createUIMessageStreamResponse({
        stream:toUIMessageStream({
           stream:result.stream,
           originalMessages:messages,
           generateMessageId:createIdGenerator({prefix:"msg" , size:16}),
           // Send a user-safe message to the browser; streamText logs the full error on the server.
           onError: getFriendlyAIErrorMessage,
           onEnd:async({messages:finalMessages})=>{
            try {
                // Skip empty assistant messages left behind by a failed reply.
                const toSave = finalMessages.filter(
                    (m) => m.role !== "assistant" ||
                        m.parts.some((p) => p.type === "text" && p.text.trim() !== "")
                );
                await saveChatMessages(id , toSave , {updateTitle:false})
            } catch (error) {
                console.error(error);
            }
           }
        })
    })

}