package com.recall.model;

import java.util.List;

/**
 * Response body of {@code GET /api/search?q=...}.
 */
public record SearchResponse(
        String query,
        List<String> terms,
        long documentsSearched,
        long elapsedMs,
        List<SearchResult> results) {
}
