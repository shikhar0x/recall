package com.recall;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Recall — A Local-First Knowledge Assistant.
 *
 * <p>Entry point of the Spring Boot backend. The interesting algorithms live in
 * {@code com.recall.search} and are deliberately implemented with only the DSA
 * constructs allowed by the course syllabus (arrays, ArrayList, loops,
 * conditionals, String methods) — no hashing, no streams, no library sorts.</p>
 */
@SpringBootApplication
public class RecallApplication {

    /** Version reported by GET /api/health and used for the artifact name. */
    public static final String VERSION = "1.0.0";

    public static void main(String[] args) {
        SpringApplication.run(RecallApplication.class, args);
    }
}
