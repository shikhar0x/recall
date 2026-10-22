package com.recall.search;

import java.util.List;

/**
 * <b>DSA core — snippet extraction.</b>
 *
 * <p>Builds a short, human-readable excerpt of a document around the first
 * word that matches one of the query terms. The window is fixed-size:
 * {@code [hit - 12, hit + 20)} words, clamped to the document bounds. If no
 * word matches (possible when the caller passes candidate terms rather than
 * confirmed matches), the first 32 words are used as a fallback.</p>
 *
 * <p><b>Complexity:</b> finding the first hit is a linear scan O(W) over the
 * W words; the window join is O(window) = O(32). Space O(window). The
 * {@code matchedTerms.contains(...)} membership test is a linear scan over Q
 * terms, giving O(Q) per word in the scan phase — Q is a handful of words, so
 * this is fine and keeps us free of hash-based structures.</p>
 */
public final class SnippetGenerator {

    /** Words of context kept before the first matched word. */
    private static final int CONTEXT_BEFORE = 12;
    /** Words of context kept after the first matched word (exclusive bound). */
    private static final int CONTEXT_AFTER = 20;
    /** Number of words shown when no term matched (fallback excerpt). */
    private static final int FALLBACK_WORDS = 32;

    private SnippetGenerator() {
        // static utility class — no instances
    }

    /**
     * @param words        the document words (already whitespace-split, trimmed content)
     * @param matchedTerms normalized terms to look for
     * @return the snippet, with a leading "… " / trailing " …" when the window
     *         was cut off at either end; never null
     */
    public static String generate(String[] words, List<String> matchedTerms) {
        if (words == null || words.length == 0) {
            return "";
        }

        // Linear scan for the first word whose normalized form is a query term.
        int hit = -1;
        for (int i = 0; i < words.length; i++) {
            if (matchedTerms.contains(QueryProcessor.normalizeToken(words[i]))) {
                hit = i;
                break;
            }
        }

        int start;
        int end;
        if (hit >= 0) {
            start = Math.max(0, hit - CONTEXT_BEFORE);       // clamp low bound
            end = Math.min(words.length, hit + CONTEXT_AFTER); // clamp high bound
        } else {
            start = 0;
            end = Math.min(words.length, FALLBACK_WORDS);
        }

        StringBuilder snippet = new StringBuilder();
        if (start > 0) {
            snippet.append("… ");
        }
        for (int i = start; i < end; i++) {
            if (i > start) {
                snippet.append(' ');
            }
            snippet.append(words[i]);
        }
        if (end < words.length) {
            snippet.append(" …");
        }
        return snippet.toString().trim();
    }
}
