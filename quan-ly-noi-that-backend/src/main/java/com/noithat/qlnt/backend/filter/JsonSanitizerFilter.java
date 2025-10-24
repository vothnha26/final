package com.noithat.qlnt.backend.filter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.ReadListener;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Filter that normalizes incoming JSON payloads by replacing non-breaking spaces (U+00A0)
 * with regular spaces. This helps avoid Jackson parse errors when clients send
 * copy-pasted JSON containing NBSP characters.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class JsonSanitizerFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        if (request instanceof HttpServletRequest httpRequest
                && isJsonContent(httpRequest)) {
            // Wrap request to sanitize the body
            SanitizedRequestWrapper sanitized = new SanitizedRequestWrapper(httpRequest);
            chain.doFilter(sanitized, response);
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isJsonContent(HttpServletRequest request) {
        String contentType = request.getContentType();
        return contentType != null && contentType.toLowerCase().contains("application/json");
    }

    private static class SanitizedRequestWrapper extends HttpServletRequestWrapper {
        private final byte[] sanitizedBody;

        SanitizedRequestWrapper(HttpServletRequest request) throws IOException {
            super(request);

            // Read raw bytes from the request input stream to avoid any intermediate decoding
            byte[] raw;
            try (ServletInputStream sis = request.getInputStream()) {
                raw = sis.readAllBytes();
            }

            if (raw == null) raw = new byte[0];

            // Decode using UTF-8 explicitly (clients should send UTF-8 JSON); this prevents
            // sequences like 0xC2 0xA0 (UTF-8 for NBSP) from being misinterpreted as 'Â' + 'Â'
            String body = new String(raw, StandardCharsets.UTF_8);

            // Replace non-breaking space (U+00A0) with normal space
            String normalized = body.replace('\u00A0', ' ');

            // Additional normalization could be added here (e.g., trimming BOM)

            sanitizedBody = normalized.getBytes(StandardCharsets.UTF_8);
        }

        @Override
        public ServletInputStream getInputStream() {
            final ByteArrayInputStream bais = new ByteArrayInputStream(sanitizedBody);

            return new ServletInputStream() {
                @Override
                public int read() {
                    return bais.read();
                }

                @Override
                public boolean isFinished() {
                    return bais.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(ReadListener readListener) {
                    // Not implemented
                }
            };
        }

            @Override
            public BufferedReader getReader() {
                return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
            }
    }
}
