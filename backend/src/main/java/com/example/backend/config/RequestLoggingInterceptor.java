package com.example.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;
import java.util.stream.Collectors;

/**
 * Interceptor to log all incoming HTTP requests
 */
@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String queryString = request.getQueryString() != null ? "?" + request.getQueryString() : "";
        String parameters = request.getParameterMap().entrySet().stream()
                .map(entry -> entry.getKey() + "=" + String.join(",", entry.getValue()))
                .collect(Collectors.joining(", "));
        
        System.out.println("\n----- API Request -----");
        System.out.println("Method: " + request.getMethod());
        System.out.println("URI: " + request.getRequestURI() + queryString);
        System.out.println("Parameters: " + (parameters.isEmpty() ? "none" : parameters));
        System.out.println("----- End Request -----\n");
        
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        String queryString = request.getQueryString() != null ? "?" + request.getQueryString() : "";
        
        System.out.println("\n----- API Response -----");
        System.out.println("Method: " + request.getMethod());
        System.out.println("URI: " + request.getRequestURI() + queryString);
        System.out.println("Status: " + response.getStatus());
        System.out.println("----- End Response -----\n");
    }
}