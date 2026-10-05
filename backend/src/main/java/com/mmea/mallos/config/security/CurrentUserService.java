package com.mmea.mallos.config.security;

import com.mmea.mallos.user.model.User;
import com.mmea.mallos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Resolves the caller from the authenticated principal instead of trusting
 * client-supplied identity headers (e.g. the old X-User-Id header, which was
 * accepted as-is and could be spoofed).
 */
@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    /**
     * @return the id of the currently authenticated user
     * @throws UsernameNotFoundException when the request is not authenticated
     */
    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            throw new UsernameNotFoundException("Not authenticated");
        }

        Object principal = auth.getPrincipal();
        String username;
        if (principal instanceof UserDetails details) {
            username = details.getUsername();
        } else if (principal instanceof String name) {
            username = name;
        } else {
            throw new UsernameNotFoundException("Not authenticated");
        }

        return userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }
}