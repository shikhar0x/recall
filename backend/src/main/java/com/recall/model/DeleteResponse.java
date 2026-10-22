package com.recall.model;

/**
 * Response body of {@code DELETE /api/documents/{id}}.
 */
public record DeleteResponse(boolean deleted, long id) {
}
