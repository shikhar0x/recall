package com.recall.model;

/**
 * Reference to one of the documents that grounded an AI answer. Scores come
 * from the local search engine — never from the model.
 */
public record SourceRef(long documentId, String documentName, double score) {
}
