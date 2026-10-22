package com.recall.repository;

import com.recall.model.DocumentDetail;
import com.recall.model.DocumentSummary;
import com.recall.search.DocumentRecord;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

/**
 * SQLite-backed document store built on Spring {@link JdbcTemplate}.
 *
 * <p>Note on the DSA constraints: the course restrictions (no hashing, no
 * streams, no library sorts) apply to the {@code search/} engine package.
 * {@link JdbcTemplate} is plain HTTP/DB plumbing OUTSIDE the search package —
 * it only moves rows in and out of SQLite; all SQL uses parameterized
 * placeholders (no string concatenation of user input, so no SQL injection).</p>
 */
@Repository
public class DocumentRepository {

    private final JdbcTemplate jdbcTemplate;
    private final String datasourceUrl;

    public DocumentRepository(JdbcTemplate jdbcTemplate,
                              @Value("${spring.datasource.url}") String datasourceUrl) {
        this.jdbcTemplate = jdbcTemplate;
        this.datasourceUrl = datasourceUrl;
    }

    /** Creates the documents table on first boot (idempotent). */
    @PostConstruct
    void init() {
        ensureParentDirectoryExists();
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS documents ("
                + "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                + "file_name TEXT NOT NULL, "
                + "file_type TEXT NOT NULL, "
                + "content TEXT NOT NULL, "
                + "word_count INTEGER NOT NULL, "
                + "imported_at TEXT NOT NULL)");
    }

    /**
     * SQLite does not create missing parent directories, so make sure the
     * folder of the configured {@code jdbc:sqlite:...} path exists before the
     * first statement runs.
     */
    private void ensureParentDirectoryExists() {
        if (datasourceUrl != null && datasourceUrl.startsWith("jdbc:sqlite:")) {
            try {
                Path dbPath = Path.of(datasourceUrl.substring("jdbc:sqlite:".length()));
                Path parent = dbPath.toAbsolutePath().getParent();
                if (parent != null) {
                    Files.createDirectories(parent);
                }
            } catch (Exception e) {
                throw new IllegalStateException("Could not create the database directory: " + e.getMessage(), e);
            }
        }
    }

    /** Inserts a document and returns the generated primary key. */
    public long insert(String fileName, String fileType, String content, int wordCount, String importedAt) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO documents (file_name, file_type, content, word_count, imported_at) "
                            + "VALUES (?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, fileName);
            ps.setString(2, fileType);
            ps.setString(3, content);
            ps.setInt(4, wordCount);
            ps.setString(5, importedAt);
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("SQLite did not return a generated key for the inserted document");
        }
        return key.longValue();
    }

    /** All documents, newest first (imported_at DESC, then id DESC as tie-break). */
    public List<DocumentSummary> findAllSummaries() {
        return jdbcTemplate.query(
                "SELECT id, file_name, file_type, word_count, imported_at "
                        + "FROM documents ORDER BY imported_at DESC, id DESC",
                (rs, rowNum) -> new DocumentSummary(
                        rs.getLong("id"),
                        rs.getString("file_name"),
                        rs.getString("file_type"),
                        rs.getInt("word_count"),
                        rs.getString("imported_at")));
    }

    /** One document including full content, or empty when the id is unknown. */
    public Optional<DocumentDetail> findById(long id) {
        List<DocumentDetail> found = jdbcTemplate.query(
                "SELECT id, file_name, file_type, content, word_count, imported_at "
                        + "FROM documents WHERE id = ?",
                (rs, rowNum) -> new DocumentDetail(
                        rs.getLong("id"),
                        rs.getString("file_name"),
                        rs.getString("file_type"),
                        rs.getInt("word_count"),
                        rs.getString("imported_at"),
                        rs.getString("content")),
                id);
        return found.isEmpty() ? Optional.empty() : Optional.of(found.get(0));
    }

    /** Every document in the lightweight form consumed by the search engine. */
    public List<DocumentRecord> findAllForSearch() {
        return jdbcTemplate.query(
                "SELECT id, file_name, content, word_count FROM documents",
                (rs, rowNum) -> new DocumentRecord(
                        rs.getLong("id"),
                        rs.getString("file_name"),
                        rs.getString("content"),
                        rs.getInt("word_count")));
    }

    /** Deletes one document; returns the affected row count (0 or 1). */
    public int deleteById(long id) {
        return jdbcTemplate.update("DELETE FROM documents WHERE id = ?", id);
    }

    /** Total number of stored documents. */
    public long countAll() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM documents", Long.class);
        return count == null ? 0L : count;
    }

    /** Sum of all word counts (COALESCE keeps an empty table at 0 instead of null). */
    public long sumWords() {
        Long total = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(word_count), 0) FROM documents", Long.class);
        return total == null ? 0L : total;
    }
}
