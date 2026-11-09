import { APICallError, RetryError } from "ai";

// Written for visitors of the live demo (friends, recruiters): say what happened,
// that it isn't their fault, and what they can do.
const UNAVAILABLE =
  "AI replies are paused: this demo's OpenAI API key has expired or been revoked. The app itself is working — the owner just needs to update the key. If you know the owner, please let them know. Thanks!";
const OUT_OF_CREDITS =
  "AI replies are paused: this demo's OpenAI account has run out of credits. The app itself is working — the owner just needs to top up the account. If you know the owner, please let them know. Thanks!";
const RATE_LIMITED =
  "Thinkora is getting a lot of messages at once. Please wait a few seconds and press Retry.";
const PROVIDER_DOWN =
  "OpenAI, the AI service behind Thinkora, is having trouble right now. Please wait a moment and press Retry.";
const GENERIC =
  "Thinkora couldn't finish that reply. Please press Retry, or send your message again.";

/**
 * Maps an AI provider error to a message that is safe to show users.
 *
 * Never returns provider details (keys, account info, raw responses); the full
 * error is still logged on the server by `streamText`.
 */
export function getFriendlyAIErrorMessage(error: unknown): string {
  // The SDK retries failed calls and wraps the final failure in a RetryError.
  const cause = RetryError.isInstance(error) ? error.lastError : error;

  if (APICallError.isInstance(cause)) {
    const status = cause.statusCode;
    const body = (cause.responseBody ?? "").toLowerCase();

    // Invalid, expired, or revoked API key / no access to the model.
    if (status === 401 || status === 403) return UNAVAILABLE;
    // No credits left (OpenAI reports this as 429 "insufficient_quota").
    if (status === 402 || body.includes("insufficient_quota")) return OUT_OF_CREDITS;
    if (status === 429) return RATE_LIMITED;
    if (status !== undefined && status >= 500) return PROVIDER_DOWN;
  }

  // API key environment variable missing entirely.
  if (cause instanceof Error && cause.name === "AI_LoadAPIKeyError") {
    return UNAVAILABLE;
  }

  return GENERIC;
}
