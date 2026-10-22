package com.recall.controller;

import com.recall.model.AskResponse;
import com.recall.model.SummarizeResponse;
import com.recall.service.AiService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI endpoints ({@code /api/ai/ask}, {@code /api/ai/summarize/{id}}).
 * Thin layer over {@link AiService}; a missing/blank question or a malformed
 * body is handled by the service + global exception handler.
 */
@RestController
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    /** Request body of {@code POST /api/ai/ask}. */
    public record AskRequest(String question) {
    }

    @PostMapping("/api/ai/ask")
    public AskResponse ask(@RequestBody(required = false) AskRequest request) {
        return aiService.ask(request == null ? null : request.question());
    }

    @PostMapping("/api/ai/summarize/{id}")
    public SummarizeResponse summarize(@PathVariable long id) {
        return aiService.summarize(id);
    }
}
