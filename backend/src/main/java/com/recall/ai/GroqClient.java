package com.recall.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.recall.service.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Minimal client for the Groq chat-completions API (OpenAI-compatible).
 *
 * <p>Uses the JDK's {@link HttpClient}. Jackson {@link ObjectMapper} is used
 * only here and in other plumbing layers to build/parse JSON — it is outside
 * the {@code search/} DSA package, where the syllabus restrictions apply.</p>
 *
 * <p>Security: the API key is only ever sent in the Authorization header;
 * it is never logged and never included in error messages.</p>
 */
@Component
public class GroqClient {

    private static final Logger log = LoggerFactory.getLogger(GroqClient.class);

    public static final String MISSING_KEY_MESSAGE =
            "Groq API key is not configured on the backend. Set GROQ_API_KEY (and optionally GROQ_MODEL) and restart.";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public GroqClient(ObjectMapper objectMapper,
                      @Value("${recall.ai.api-key}") String apiKey,
                      @Value("${recall.ai.model}") String model,
                      @Value("${recall.ai.base-url}") String baseUrl) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.baseUrl = baseUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /** @return true when a non-blank API key is configured. */
    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    /**
     * One chat completion round-trip.
     *
     * @param systemPrompt fixed instructions for the model
     * @param userPrompt   question + retrieved passages (or a summarization request)
     * @return the assistant message content
     * @throws ApiException 503-shaped when the key is missing, the API is
     *                      unreachable, rejects the request, or returns nothing usable
     */
    public String complete(String systemPrompt, String userPrompt) {
        if (apiKey.isBlank()) {
            throw ApiException.unavailable(MISSING_KEY_MESSAGE);
        }

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)),
                "temperature", 0.2,
                "max_tokens", 1024);

        HttpRequest request;
        String json;
        try {
            json = objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            throw new GroqApiException("Could not build the Groq request payload.");
        }
        try {
            request = HttpRequest.newBuilder(URI.create(baseUrl + "/chat/completions"))
                    .timeout(Duration.ofSeconds(45))
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();
        } catch (Exception e) {
            throw new GroqApiException("Groq base URL is invalid: " + baseUrl);
        }

        final HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) { // HttpTimeoutException is a subclass of IOException
            // Never log the key or the full payload — only the exception class/message.
            log.warn("Groq API unreachable: {}", e.getMessage());
            throw new GroqApiException("Could not reach the Groq API. Check your internet connection.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new GroqApiException("Groq request was interrupted.");
        }

        return handleResponse(response);
    }

    private String handleResponse(HttpResponse<String> response) {
        int status = response.statusCode();
        String body = response.body() == null ? "" : response.body();

        if (status == 200) {
            try {
                JsonNode root = objectMapper.readTree(body);
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    String content = choices.get(0).path("message").path("content").asText("");
                    if (!content.isBlank()) {
                        return content;
                    }
                }
            } catch (Exception e) {
                log.warn("Could not parse Groq response body");
            }
            throw new GroqApiException("Groq returned an empty response.");
        }

        // Safe, non-secret detail from Groq's standard {"error":{"message":...}} body.
        String detail = extractErrorMessage(body);
        if (status == 401 || status == 403) {
            throw new GroqApiException("Groq rejected the API key (invalid or unauthorized)." + detail);
        }
        if (status == 429) {
            throw new GroqApiException("Groq rate limit exceeded. Please try again shortly." + detail);
        }
        throw new GroqApiException("Groq request failed (HTTP " + status + ")." + detail);
    }

    private String extractErrorMessage(String body) {
        try {
            String message = objectMapper.readTree(body).path("error").path("message").asText("");
            if (!message.isBlank()) {
                return " Groq said: " + message;
            }
        } catch (Exception ignored) {
            // body was not JSON — ignore, keep the generic message
        }
        return "";
    }
}
