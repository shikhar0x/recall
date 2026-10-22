package com.recall.controller;

import com.recall.RecallApplication;
import com.recall.model.HealthResponse;
import com.recall.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * {@code GET /api/health} — service status and library statistics.
 */
@RestController
public class HealthController {

    private final DocumentRepository documentRepository;
    private final String groqApiKey;
    private final String groqModel;
    private final String dbPath;

    public HealthController(DocumentRepository documentRepository,
                            @Value("${recall.ai.api-key}") String groqApiKey,
                            @Value("${recall.ai.model}") String groqModel,
                            @Value("${RECALL_DB_PATH:./data/recall.db}") String dbPath) {
        this.documentRepository = documentRepository;
        this.groqApiKey = groqApiKey;
        this.groqModel = groqModel;
        this.dbPath = dbPath;
    }

    @GetMapping("/api/health")
    public HealthResponse health() {
        return new HealthResponse(
                "UP",
                "Recall",
                RecallApplication.VERSION,
                groqApiKey != null && !groqApiKey.isBlank(),
                groqModel,
                documentRepository.countAll(),
                documentRepository.sumWords(),
                System.getProperty("java.version"),
                dbPath);
    }
}
