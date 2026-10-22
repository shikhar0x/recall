package com.recall.ai;

import com.recall.service.ApiException;
import org.springframework.http.HttpStatus;

/**
 * Thrown when the Groq chat-completions API cannot be reached, rejects the
 * request, or returns unusable output. Extends {@link ApiException} with a
 * fixed {@code 503 SERVICE_UNAVAILABLE} status so the global exception handler
 * renders it as {@code {"message": "..."}} without extra mapping code.
 */
public class GroqApiException extends ApiException {

    public GroqApiException(String message) {
        super(HttpStatus.SERVICE_UNAVAILABLE, message);
    }
}
