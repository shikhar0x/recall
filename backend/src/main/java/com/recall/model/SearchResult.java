package com.recall.model;

import java.util.List;

/**
 * One ranked hit of the local DSA search engine.
 *
 * <p>{@code score} is the normalized term frequency (total occurrences of the
 * matched terms divided by the document's word count) computed by
 * {@code SearchScorer}; {@code snippet} is a window around the first match.</p>
 */
public record SearchResult(
        long documentId,
        String documentName,
        double score,
        String snippet,
        List<String> matchedTerms,
        int wordCount) {
}
