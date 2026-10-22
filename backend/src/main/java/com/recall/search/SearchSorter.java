package com.recall.search;

import com.recall.model.SearchResult;

import java.util.List;

/**
 * <b>DSA core — ranking by hand-written INSERTION SORT.</b>
 *
 * <p>Sorts the scored results in place, descending by score, with ties broken
 * by ascending file name (case-insensitive). Deliberately written by hand —
 * {@code Collections.sort}, {@code List.sort}, streams and comparators are
 * outside the allowed DSA syllabus.</p>
 *
 * <p><b>Algorithm (insertion sort, Swing-style):</b> walk the list from index
 * 1; each {@code key} is compared against the sorted prefix to its left; every
 * element strictly "greater" than the key (worse rank) is shifted one slot
 * right; the key is then dropped into the hole.</p>
 *
 * <p><b>Complexity:</b> O(n²) comparisons in the worst and average case,
 * O(n) in the best case (already sorted input), O(1) auxiliary space, and the
 * sort is <i>stable</i> (equal elements keep their relative order because we
 * only shift on {@code > 0}, never on {@code >= 0}). For the small result sets
 * of a personal knowledge base (n ≈ tens) n² is a non-issue.</p>
 */
public final class SearchSorter {

    private SearchSorter() {
        // static utility class — no instances
    }

    /**
     * Sorts {@code results} in place: descending {@code score}, ties broken by
     * ascending {@code documentName} ignoring case.
     *
     * @param results the list to sort (mutated in place)
     */
    public static void sortByRelevance(List<SearchResult> results) {
        for (int i = 1; i < results.size(); i++) {
            SearchResult key = results.get(i);
            int j = i - 1;
            // Shift elements that rank strictly worse than key one position right.
            while (j >= 0 && compare(results.get(j), key) > 0) {
                results.set(j + 1, results.get(j));
                j--;
            }
            results.set(j + 1, key);
        }
    }

    /**
     * Ranking order: {@code a} should come before {@code b} iff
     * {@code compare(a, b) < 0} — i.e. a has the higher score, or equal score
     * and alphabetically smaller name (case-insensitive).
     */
    private static int compare(SearchResult a, SearchResult b) {
        int byScore = Double.compare(b.score(), a.score()); // descending score
        if (byScore != 0) {
            return byScore;
        }
        return a.documentName().compareToIgnoreCase(b.documentName()); // ascending name
    }
}
