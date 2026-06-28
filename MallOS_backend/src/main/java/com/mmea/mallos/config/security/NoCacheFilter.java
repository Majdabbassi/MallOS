package com.mmea.mallos.config.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class NoCacheFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Add cache-prevention headers for Swagger endpoints
        if (httpRequest.getRequestURI().contains("/swagger-ui") || httpRequest.getRequestURI().contains("/v3/api-docs")) {
            httpResponse.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0, private");
            httpResponse.setHeader("Pragma", "no-cache");
            httpResponse.setHeader("Expires", "0");
            httpResponse.setHeader("WWW-Authenticate", "Basic realm=\"Swagger API\"");
        }

        chain.doFilter(request, response);
    }
}
