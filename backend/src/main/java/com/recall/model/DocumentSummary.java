package com.recall.model;

/**
 * Compact document representation used in the documents list.
 */
public record DocumentSummary(
        long id,
        String fileName,
        String fileType,
        int wordCount,
        String importedAt) {
}
