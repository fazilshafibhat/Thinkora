"use server";

import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";


/**
 * Returns the conversation to show on the "new chat" screen.
 *
 * Reuses the user's most recent empty conversation (no messages yet) so that
 * refreshing, signing in again, or clicking "New chat" repeatedly never piles
 * up duplicate "New Chat" entries. Creates one only when no empty chat exists.
 *
 * @returns The ID of the empty conversation to open.
 */
export async function startNewChat(){
    const user = await requireUser();

    const existing = await prisma.conversation.findFirst({
        where: {
            userId: user.id,
            isArchived: false,
            messages: { none: {} },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
    });

    if (existing) {
        return existing.id;
    }

    const conversation = await prisma.conversation.create({
        data:{
            userId:user.id,
            title:"New Chat"
        }
    });

    return conversation.id;
}
