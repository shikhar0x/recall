package com.recall.search;

import com.recall.model.SearchResult;

import java.util.ArrayList;
import java.util.List;

/**
 * <b>DSA core — the local search engine (the heart of the project).</b>
 *
 * <p>Pipeline, in order:</p>
 * <ol>
 *   <li>{@link QueryProcessor#process} normalizes the raw query into distinct terms;</li>
 *   <li>a <b>linear search</b> over the whole document collection (an ArrayList
 *       scanned with a plain loop — no index, no hashing, exactly the
 *       syllabus-legal approach);</li>
 *   <li>each document is scored by {@link SearchScorer}; {@code null} results
 *       (no match) are skipped;</li>
 *   <li>surviving results are ranked by {@link SearchSorter} (hand-written
 *       insertion sort).</li>
 * </ol>
 *
 * <p><b>Complexity:</b> with N documents of W words each and Q query terms,
 * scoring is O(N × Q × W) and ranking is O(R²) for R results, so the total is
 * O(N × Q × W + R²). Space is O(N + R). This is the textbook linear-search
 * trade-off: we accept a full scan of every document per query in exchange
 * for zero preprocessing and zero hashing — completely index-free.</p>
 *
 * <p>The engine is stateless (no fields, thread-safe); one instance can be
 * shared freely.</p>
 */
public class SearchEngine {

    /**
     * @param terms   the normalized distinct query terms (empty for a blank query)
     * @param results ranked matches, best first (empty when nothing matched)
     */
    public record EngineResult(List<String> terms, List<SearchResult> results) {
    }

    /**
     * Runs the full search pipeline over the given documents.
     *
     * @param documents all documents of the library (unorderered input is fine)
     * @param rawQuery  the raw user query; blank/null yields no terms and no results
     * @return the distinct terms plus the ranked results
     */
    public EngineResult search(List<DocumentRecord> documents, String rawQuery) {
        // 1. Query processing.
        List<String> terms = QueryProcessor.process(rawQuery);

        // 2 + 3. Linear search: score every document, keep the matches.
        List<SearchResult> results = new ArrayList<>();
        for (DocumentRecord document : documents) {
            SearchResult scored = SearchScorer.score(document, terms);
            if (scored != null) {
                results.add(scored);
            }
        }

        // 4. Rank by hand-written insertion sort (descending score, name tie-break).
        SearchSorter.sortByRelevance(results);

        return new EngineResult(terms, results);
    }
}
