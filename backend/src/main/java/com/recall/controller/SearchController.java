package com.recall.controller;

import com.recall.model.SearchResponse;
import com.recall.repository.DocumentRepository;
import com.recall.search.DocumentRecord;
import com.recall.search.SearchEngine;
import com.recall.service.ApiException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * {@code GET /api/search?q=...} — runs the local DSA search engine
 * ({@link SearchEngine}) over the whole library. The controller only wires
 * inputs/outputs; every algorithm lives in the {@code search/} package.
 */
@RestController
public class SearchController {

    private final DocumentRepository documentRepository;
    private final SearchEngine searchEngine = new SearchEngine(); // stateless, thread-safe

    public SearchController(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    @GetMapping("/api/search")
    public SearchResponse search(@RequestParam(name = "q", required = false) String q) {
        if (q == null || q.isBlank()) {
            throw ApiException.badRequest("Query parameter 'q' is required");
        }
        List<DocumentRecord> documents = documentRepository.findAllForSearch();
        long startNanos = System.nanoTime();
        SearchEngine.EngineResult engineResult = searchEngine.search(documents, q);
        long elapsedMs = (System.nanoTime() - startNanos) / 1_000_000L;
        return new SearchResponse(q, engineResult.terms(), documents.size(), elapsedMs, engineResult.results());
    }
}
