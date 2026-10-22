package com.recall.search;

/**
 * Immutable in-memory view of a document row, used as the input of the local
 * search engine. Plain record — no Java collections beyond what the syllabus
 * allows, no framework annotations.
 *
 * @param id        database primary key
 * @param fileName  original file name, e.g. "notes.txt"
 * @param content   full raw text of the document
 * @param wordCount number of whitespace-separated tokens in {@code content}
 */
public record DocumentRecord(long id, String fileName, String content, int wordCount) {
}
