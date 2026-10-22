package com.recall.model;

import java.util.List;

/**
 * Response body of {@code POST /api/ai/ask}.
 */
public record AskResponse(String answer, List<SourceRef> sources, String model, boolean usedAi) {
}
