package com.noithat.qlnt.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cấu hình Web MVC để serve static files (uploaded images)
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    /**
     * Cấu hình để serve các file upload từ thư mục uploads/
     * URL pattern: /uploads/** sẽ map tới file:./uploads/
     * 
     * Ví dụ: 
     * - Request: http://localhost:8080/uploads/products/1/abc.jpg
     * - File: ./uploads/products/1/abc.jpg
     */
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        registry
            .addResourceHandler("/uploads/**")
            .addResourceLocations("file:./uploads/");
    }
}
