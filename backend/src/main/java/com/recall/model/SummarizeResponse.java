package com.recall.model;

/**
 * Response body of {@code POST /api/ai/summarize/{id}}.
 */
public record SummarizeResponse(
        String summary,
        long documentId,
        String documentName,
        String model,
        boolean truncated) {
}
