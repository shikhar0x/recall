package com.recall.search;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * <b>DSA core — query processing (tokenization + normalization).</b>
 *
 * <p>Turns a raw user query into a list of distinct, normalized search terms:
 * trim, split on whitespace, lowercase (Locale.ROOT), strip every character
 * that is not {@code a-z0-9}, drop empty tokens, deduplicate while keeping the
 * first-occurrence order.</p>
 *
 * <p><b>Complexity:</b> for a query with Q raw tokens the split and the
 * per-token normalization are O(Q) in total (String methods scan each token
 * once). Deduplication uses {@code ArrayList.contains}, which is a linear
 * scan, making dedup O(Q²) worst case. Q is tiny (a query is a handful of
 * words), so quadratic behavior is irrelevant here — and it lets us stay
 * inside the syllabus: a hash-based set would be O(Q) but hashing is outside
 * the allowed constructs.</p>
 *
 * <p>Punctuation-insensitive matching is the point of the normalization:
 * searching {@code sort} must find the word {@code sort,} or {@code (sort)}
 * inside a document.</p>
 */
public final class QueryProcessor {

    private QueryProcessor() {
        // static utility class — no instances
    }

    /**
     * Normalizes and deduplicates the raw query.
     *
     * @param rawQuery the user-supplied query (may be null or blank)
     * @return distinct normalized terms in first-occurrence order; empty for a
     *         null/blank query or a query with no alphanumeric characters
     */
    public static List<String> process(String rawQuery) {
        List<String> terms = new ArrayList<>();
        if (rawQuery == null) {
            return terms;
        }
        String trimmed = rawQuery.trim();
        if (trimmed.isEmpty()) {
            return terms;
        }
        String[] tokens = trimmed.split("\\s+"); // O(len) whitespace split
        for (String token : tokens) {
            String normalized = normalizeToken(token);
            if (normalized.isEmpty()) {
                continue; // token was pure punctuation
            }
            // Linear contains() scan → O(Q²) dedupe overall, first-occurrence order kept.
            if (!terms.contains(normalized)) {
                terms.add(normalized);
            }
        }
        return terms;
    }

    /**
     * Shared token normalization: lowercase, then remove every character that
     * is not a-z or 0-9. Used by both the query side (here) and the document
     * side ({@link SearchScorer}) so both sides are always comparable.
     *
     * @param token a single whitespace-separated word, e.g. {@code "Sort,"}
     * @return normalized token, e.g. {@code "sort"}; may be empty
     */
    static String normalizeToken(String token) {
        return token.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }
}
