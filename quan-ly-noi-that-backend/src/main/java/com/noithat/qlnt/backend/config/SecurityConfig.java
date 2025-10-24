package com.noithat.qlnt.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
// UsernamePasswordAuthenticationFilter import removed (not used in session-based config)

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableMethodSecurity // Bật tính năng phân quyền trên từng phương thức (tùy chọn nhưng nên có)
public class SecurityConfig {

    private final AuthenticationProvider authenticationProvider;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Value("${app.security.enabled:true}")
    private boolean securityEnabled;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable());

        if (!securityEnabled) {
            // Development mode: disable all security for testing
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
            return http.build();
        }

        http
            .authorizeHttpRequests(auth -> auth
                // 1. Allow authentication endpoints
                .requestMatchers("/api/v1/auth/**").permitAll()

                // WebSocket SockJS handshake endpoints
                .requestMatchers("/ws-notifications/**").permitAll()

                // 2. Admin-only routes
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                // 3. Staff-only routes (frontend and API)
                // Frontend routes under /staff/** should only be accessible to staff users
                .requestMatchers("/staff/**").hasRole("STAFF")
                // Backend API for staff dashboard
                .requestMatchers("/api/v1/dashboard/staff").hasRole("STAFF")

                // 4. All other requests require authentication
                .anyRequest().authenticated()
            )
            // Use stateful sessions so backend manages authentication via HttpSession/cookie
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authenticationProvider(authenticationProvider);

        // If Authorization header with Bearer token is present, JwtAuthenticationFilter will authenticate
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        // NOTE: JWT filter removed for session-based authentication. If JWT is desired,
        // set app.security.enabled=false and use JWT exclusively, or adapt the frontend
        // to attach Bearer tokens.

        return http.build();
    }
}