package com.recall.service;

import com.recall.model.DeleteResponse;
import com.recall.model.DocumentDetail;
import com.recall.model.DocumentSummary;
import com.recall.model.DocumentsResponse;
import com.recall.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Business logic for importing, listing, reading and deleting documents.
 * All validation errors are raised as {@link ApiException} so the global
 * handler renders the uniform {@code {"message": "..."}} body.
 */
@Service
public class DocumentService {

    private final DocumentRepository repository;
    private final List<String> allowedExtensions;
    private final long maxUploadBytes;

    public DocumentService(DocumentRepository repository,
                           @Value("${recall.allowed-extensions}") String allowedExtensionsCsv,
                           @Value("${RECALL_MAX_UPLOAD_MB:5}") int maxUploadMb) {
        this.repository = repository;
        this.allowedExtensions = new ArrayList<>();
        for (String raw : allowedExtensionsCsv.split(",")) {
            String ext = raw.trim().toLowerCase(Locale.ROOT);
            if (!ext.isEmpty()) {
                this.allowedExtensions.add(ext);
            }
        }
        this.maxUploadBytes = maxUploadMb * 1024L * 1024L;
    }

    /**
     * Validates, reads and stores an uploaded text document.
     *
     * <p>Validation order: file present → size limit → usable name and
     * allowed extension → readable UTF-8 content with actual text. The content
     * is sanitized by stripping NUL characters and normalizing CRLF (and lone
     * CR, an old-Mac line ending — harmless superset of the required CRLF
     * normalization) to LF.</p>
     */
    public DocumentDetail importDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("No file provided. Attach a text file using the 'file' form field.");
        }
        if (file.getSize() > maxUploadBytes) {
            throw ApiException.payloadTooLarge("File exceeds the upload size limit");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw ApiException.badRequest("Uploaded file has no name, so its type cannot be determined.");
        }
        // Strip any client-supplied path (some browsers send full paths).
        String fileName = originalName;
        int lastSlash = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'));
        if (lastSlash >= 0) {
            fileName = fileName.substring(lastSlash + 1);
        }
        // Extension = after the last dot, case-insensitive.
        int lastDot = fileName.lastIndexOf('.');
        String extension = lastDot < 0 ? "" : fileName.substring(lastDot).toLowerCase(Locale.ROOT);
        if (!allowedExtensions.contains(extension)) {
            throw ApiException.badRequest("Unsupported file type. Allowed types: " + String.join(", ", allowedExtensions));
        }
        String fileType = extension.substring(1); // ".txt" -> "txt"

        String content;
        try {
            content = new String(file.getBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read the uploaded file");
        }
        content = content.replace("\u0000", "");          // strip NUL chars
        content = content.replace("\r\n", "\n").replace('\r', '\n'); // normalize line endings

        int wordCount = countWords(content);
        if (content.trim().isEmpty()) {
            throw ApiException.badRequest("Document contains no readable text");
        }

        String importedAt = Instant.now().truncatedTo(ChronoUnit.SECONDS).toString();
        long id = repository.insert(fileName, fileType, content, wordCount, importedAt);
        return new DocumentDetail(id, fileName, fileType, wordCount, importedAt, content);
    }

    /** @return all documents, newest first. */
    public DocumentsResponse listDocuments() {
        return new DocumentsResponse(repository.findAllSummaries());
    }

    /** @return one document with full content; 404 when unknown. */
    public DocumentDetail getDocument(long id) {
        return repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Document not found: " + id));
    }

    /** Deletes a document; 404 when the id is unknown. */
    public DeleteResponse deleteDocument(long id) {
        int rows = repository.deleteById(id);
        if (rows == 0) {
            throw ApiException.notFound("Document not found: " + id);
        }
        return new DeleteResponse(true, id);
    }

    /** Whitespace-token count of the trimmed content, 0 when blank. */
    public static int countWords(String content) {
        String trimmed = content == null ? "" : content.trim();
        return trimmed.isEmpty() ? 0 : trimmed.split("\\s+").length;
    }
}
