"use client";
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useQueryClient } from '@tanstack/react-query';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChat } from "@ai-sdk/react"
import React, { useMemo } from 'react'
import { useConversations } from '../hooks/use-conversation';
import { queryKeys } from '../utils/query-keys';
import { AlertCircleIcon, RotateCcwIcon } from 'lucide-react';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ChatEmpty } from './chat-empty';
import { ChatMessages } from './chat-messages';
import { ChatComposer } from './chat-composer';

type ConversationViewProps = {
    conversationId: string;
    initialMessages: UIMessage[];
    /** Signed-in user's first name, loaded on the server for the empty-state greeting. */
    firstName?: string | null;
};

/**
 * Main chat view — header, message list (or empty state), and composer with streaming.
 */
export const ConversationView = ({ conversationId, initialMessages, firstName }: ConversationViewProps) => {

    const queryClient = useQueryClient();
    const { data: conversations } = useConversations();

    const transport = useMemo(() => new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
            body: {
                id, message: messages.at(-1)
            }
        })
    }), []);

    // Errors are shown inline above the composer (see below), with a Retry button.
    const { messages, sendMessage, regenerate, clearError, error, status } = useChat({
        id: conversationId,
        messages: initialMessages,
        transport,
        onFinish: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversations.all,
            });
        },
    })
    // Lock the composer only while a reply is in flight, so it unlocks after an error.
    const isBusy = status === "submitted" || status === "streaming";
    const title =
    conversations?.find((item) => item.id === conversationId)?.title ?? "Chat";

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mx-1 h-4" />
                <h1 className="truncate text-sm font-medium">{title}</h1>
            </header>

            {messages.length === 0 ? (
                <ChatEmpty seed={conversationId} firstName={firstName} />
            ) : (
                <ChatMessages messages={messages} status={status} />
            )}

            {error ? (
                <div className="mx-auto w-full max-w-3xl px-4 pb-2">
                    <Alert variant="destructive" role="alert">
                        <AlertCircleIcon />
                        <AlertDescription className="pr-20">
                            {error.message || "Something went wrong generating a reply."}
                        </AlertDescription>
                        <AlertAction>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    clearError();
                                    void regenerate();
                                }}
                            >
                                <RotateCcwIcon />
                                Retry
                            </Button>
                        </AlertAction>
                    </Alert>
                </div>
            ) : null}

            <ChatComposer
                onSend={(text) => {
                    if (error) clearError();
                    void sendMessage({ text });
                }}
                isSending={isBusy}
                autoFocus
            />
        </div>
    )
}