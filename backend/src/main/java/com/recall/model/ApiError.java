package com.recall.model;

/**
 * Uniform error body returned by every error path: {@code {"message": "..."}}.
 */
public record ApiError(String message) {
}
