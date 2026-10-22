package com.recall.model;

/**
 * Full document representation (summary fields plus the raw {@code content}).
 * Returned by {@code POST /api/documents} and {@code GET /api/documents/{id}}.
 */
public record DocumentDetail(
        long id,
        String fileName,
        String fileType,
        int wordCount,
        String importedAt,
        String content) {
}
