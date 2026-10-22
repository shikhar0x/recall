package com.recall.model;

import java.util.List;

/**
 * Response body of {@code GET /api/documents} (newest first).
 */
public record DocumentsResponse(List<DocumentSummary> documents) {
}
