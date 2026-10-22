package com.recall.model;

/**
 * Response body of {@code GET /api/health}.
 */
public record HealthResponse(
        String status,
        String app,
        String version,
        boolean aiConfigured,
        String aiModel,
        long documentCount,
        long totalWords,
        String javaVersion,
        String dbPath) {
}
