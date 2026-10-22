package com.recall.controller;

import com.recall.model.DeleteResponse;
import com.recall.model.DocumentDetail;
import com.recall.model.DocumentsResponse;
import com.recall.service.DocumentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Document CRUD endpoints. Thin layer — all logic lives in {@link DocumentService}.
 */
@RestController
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping("/api/documents")
    public DocumentsResponse listDocuments() {
        return documentService.listDocuments();
    }

    /** Multipart upload; the file is read from the form field named {@code file}. */
    @PostMapping("/api/documents")
    public ResponseEntity<DocumentDetail> uploadDocument(
            @RequestParam(name = "file", required = false) MultipartFile file) {
        DocumentDetail detail = documentService.importDocument(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(detail);
    }

    @GetMapping("/api/documents/{id}")
    public DocumentDetail getDocument(@PathVariable long id) {
        return documentService.getDocument(id);
    }

    @DeleteMapping("/api/documents/{id}")
    public DeleteResponse deleteDocument(@PathVariable long id) {
        return documentService.deleteDocument(id);
    }
}
