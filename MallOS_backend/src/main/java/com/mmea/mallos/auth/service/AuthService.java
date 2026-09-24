package com.mmea.mallos.auth.service;

import com.mmea.mallos.auth.dto.AuthResponse;
import com.mmea.mallos.auth.dto.LoginRequest;
import com.mmea.mallos.auth.dto.RegisterRequest;
import com.mmea.mallos.mall.model.MallMember;
import com.mmea.mallos.mall.repository.MallMemberRepository;
import com.mmea.mallos.user.model.User;
import com.mmea.mallos.user.model.enums.Role;
import com.mmea.mallos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final MallMemberRepository mallMemberRepository;

    public AuthResponse registerUser(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // Self-registration always creates a plain mall user. Privileged roles
        // (SUPER_ADMIN / managers) are only ever granted server-side, never
        // from client-supplied input.
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.MALL_USER)
                .active(true)
                .build();

        userRepository.save(user);

        return AuthResponse.builder()
                .message("User registered successfully")
                .username(user.getUsername())
                .role(user.getRole().name())
                .authenticated(false)
                .build();
    }

    public AuthResponse authenticateUser(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        User user = findUserByUsernameOrEmail(request.getUsername());
        Long mallId = mallMemberRepository.findFirstByUserIdAndIsActiveTrue(user.getId())
                .map(MallMember::getMall)
                .map(mall -> mall.getId())
                .orElse(null);

        return AuthResponse.builder()
                .message("Login successful")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .authenticated(authentication.isAuthenticated())
                .mallId(mallId)
                .fullName(user.getUsername())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }

    private User findUserByUsernameOrEmail(String usernameOrEmail) {
        return userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
