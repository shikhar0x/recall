// Shared client-side view types for the Recall dashboard.

export type RecallView = "overview" | "documents" | "search" | "assistant" | "settings";

export interface SearchSeed {
  query: string;
  nonce: number;
}
