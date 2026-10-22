package com.recall.search;

import com.recall.model.SearchResult;

import java.util.ArrayList;
import java.util.List;

/**
 * <b>DSA core — relevance scoring of a single document.</b>
 *
 * <p>Counts how often each distinct query term occurs in the document and
 * produces a {@link SearchResult} with a length-normalized score:
 *
 * <pre>score = (total occurrences of all matched terms) / (word count of document)</pre>
 *
 * <p>Normalization by document length keeps a 2-hit hit inside a 50-word note
 * (score 0.04) from drowning a 2-hit inside a 5-word memo (score 0.4): the
 * short document is genuinely more relevant per word.</p>
 *
 * <p><b>Complexity:</b> for Q distinct terms and W words per document the
 * nested counting loops are O(Q × W) per document. (A pre-built term→count
 * frequency table would reduce this to O(Q + W), but building one requires
 * hashing — forbidden by the current syllabus — so the honest double loop is
 * used and documented.) Space is O(Q) for the matched-term list.</p>
 */
public final class SearchScorer {

    private SearchScorer() {
        // static utility class — no instances
    }

    /**
     * Scores one document against the distinct query terms.
     *
     * @param doc           the document to inspect
     * @param distinctTerms normalized, deduplicated query terms (from {@link QueryProcessor})
     * @return a ranked result, or {@code null} when the document matches no
     *         term (the caller must skip nulls — linear-search style filtering)
     */
    public static SearchResult score(DocumentRecord doc, List<String> distinctTerms) {
        String content = doc.content();
        if (content == null || distinctTerms.isEmpty()) {
            return null;
        }
        String trimmed = content.trim();
        String[] words = trimmed.isEmpty() ? new String[0] : trimmed.split("\\s+");
        if (words.length == 0) {
            return null; // empty document — guard against division by zero below
        }

        // Outer loop: terms (Q). Inner loop: words (W). => O(Q × W) per document.
        List<String> matchedTerms = new ArrayList<>();
        int totalOccurrences = 0;
        for (String term : distinctTerms) {
            int occurrences = 0;
            for (String word : words) {
                if (QueryProcessor.normalizeToken(word).equals(term)) {
                    occurrences++;
                }
            }
            if (occurrences > 0) {
                matchedTerms.add(term);
                totalOccurrences += occurrences;
            }
        }

        if (totalOccurrences == 0) {
            return null; // document excluded from results
        }

        double score = (double) totalOccurrences / words.length;
        String snippet = SnippetGenerator.generate(words, distinctTerms);
        return new SearchResult(doc.id(), doc.fileName(), score, snippet, matchedTerms, doc.wordCount());
    }
}
