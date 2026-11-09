import { loadChatMessages } from '@/features/ai/actions/chat-store';
import { requireUser } from '@/features/auth/action/require-user';
import { getConversation } from '@/features/conversation/actions/conversation-actions';
import { ConversationView } from '@/features/conversation/components/conversation-view';
import { notFound } from 'next/navigation';
import React from 'react'

type ConversationPageProps = {
    params: Promise<{ id: string }>;
  };

/**
 * Conversation page — loads messages and renders the chat UI for a given ID.
 */
const page = async({params}:ConversationPageProps) => {
    const {id} = await params;

    try {
      await getConversation(id)
    } catch (error) {
      notFound()
    }

    // Load the user's first name on the server so the greeting renders with it
    // immediately, instead of waiting for Clerk to load in the browser.
    const [initialMessages, user] = await Promise.all([
      loadChatMessages(id),
      requireUser(),
    ]);

  return (
    <ConversationView
      key={id}
      conversationId={id}
      initialMessages={initialMessages}
      firstName={user.firstName}
    />
  )
}

export default page