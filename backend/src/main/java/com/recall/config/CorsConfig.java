package com.recall.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;

/**
 * CORS configuration for the Recall API.
 *
 * <p>Why CORS matters here: browsers attach an {@code Origin} header to POST
 * requests (even same-origin ones). When Spring MVC sees an {@code Origin}
 * that is not allowed it rejects the request outright with
 * <b>403 Forbidden "Invalid CORS request"</b> — so a misconfigured origin list
 * breaks document upload even when the frontend and backend share a host
 * through a reverse-proxy gateway.</p>
 *
 * <p>Configuration via {@code RECALL_CORS_ORIGINS} (comma separated):</p>
 * <ul>
 *   <li>{@code *} or unset (default) — allow any origin. Sensible for a
 *       personal, local-only mini project running behind a sandbox/preview
 *       gateway where the public origin is not known in advance. The API has
 *       no cookies and no credentials ({@code allowCredentials(false)}), so a
 *       permissive origin list cannot leak authenticated data.</li>
 *   <li>Explicit list, e.g. {@code http://localhost:3000,http://127.0.0.1:3000}
 *       — restrict to exactly these origins. Recommended whenever the backend
 *       is reachable from machines other than your own (see README security
 *       notes).</li>
 * </ul>
 */
@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer(@Value("${recall.cors.origins}") String allowedOriginsCsv) {
        List<String> origins = new ArrayList<>();
        for (String raw : allowedOriginsCsv.split(",")) {
            String origin = raw.trim();
            if (!origin.isEmpty()) {
                origins.add(origin);
            }
        }

        final boolean allowAnyOrigin = origins.isEmpty() || origins.contains("*");
        final String[] originArray = origins.toArray(new String[0]);

        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                if (allowAnyOrigin) {
                    // allowedOriginPatterns("*") mirrors any Origin header value.
                    // (allowedOrigins("*") is refused by Spring when combined with
                    //  allowCredentials(true); we use credentials=false, but the
                    //  pattern form keeps us future-proof either way.)
                    registry.addMapping("/api/**")
                            .allowedOriginPatterns("*")
                            .allowedMethods("*")
                            .allowedHeaders("*")
                            .allowCredentials(false)
                            .maxAge(3600);
                } else {
                    registry.addMapping("/api/**")
                            .allowedOrigins(originArray)
                            .allowedMethods("*")
                            .allowedHeaders("*")
                            .allowCredentials(false)
                            .maxAge(3600);
                }
            }
        };
    }
}
