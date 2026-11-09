"use client";

import { MessageSquareIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/** Greetings for the empty state; `name` is ", <first name>" or "" when unknown. */
const GREETINGS: Array<(name: string) => string> = [
  (name) => `How can I help you today${name}?`,
  (name) => `Hey${name}! What's on your mind?`,
  (name) => `Good to see you${name}. Where should we start?`,
  (name) => `Hi${name}! What are we working on today?`,
  (name) => `Welcome back${name}. Ask me anything.`,
  (name) => `Hello${name}! What would you like to explore?`,
  (name) => `Ready when you are${name}. What's the plan?`,
];

/**
 * Picks a greeting from the seed (the conversation id) so it varies per chat
 * but renders identically on the server and client (no hydration mismatch).
 */
function pickGreeting(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return GREETINGS[hash % GREETINGS.length];
}

/** Empty-state placeholder shown before the first message is sent. */
export function ChatEmpty({
  seed,
  firstName,
}: {
  seed: string;
  /** Passed from the server so the name is in the first render (no late pop-in). */
  firstName?: string | null;
}) {
  const name = firstName?.trim();
  const greeting = pickGreeting(seed)(name ? `, ${name}` : "");

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageSquareIcon />
          </EmptyMedia>
          <EmptyTitle className="text-2xl tracking-tight">{greeting}</EmptyTitle>
          <EmptyDescription>
            Ask anything — replies stream in real time.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
