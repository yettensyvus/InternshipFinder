package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.dto.*;
import xyz.yettensyvus.internshipfinder.model.RefreshToken;
import xyz.yettensyvus.internshipfinder.repository.RefreshTokenRepository;
import xyz.yettensyvus.internshipfinder.repository.UserRepository;
import xyz.yettensyvus.internshipfinder.security.JwtTokenProvider;
import xyz.yettensyvus.internshipfinder.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${jwt.accessExpirationMs}")
    private long accessExpirationMs;

    @Value("${jwt.refreshExpirationMs}")
    private long refreshExpirationMs;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashed) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash token");
        }
    }

    private String generateRefreshToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private ResponseCookie buildAccessCookie(String accessJwt, HttpServletRequest httpRequest) {
        return ResponseCookie.from("accessToken", accessJwt)
                .httpOnly(true)
                .secure(httpRequest.isSecure())
                .path("/")
                .maxAge(accessExpirationMs / 1000)
                .sameSite("Lax")
                .build();
    }

    private ResponseCookie buildRefreshCookie(String refreshToken, HttpServletRequest httpRequest) {
        return ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(httpRequest.isSecure())
                .path("/api/auth/refresh")
                .maxAge(refreshExpirationMs / 1000)
                .sameSite("Lax")
                .build();
    }

    private ResponseCookie clearAccessCookie(HttpServletRequest httpRequest) {
        return ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(httpRequest.isSecure())
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }

    private ResponseCookie clearRefreshCookie(HttpServletRequest httpRequest) {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(httpRequest.isSecure())
                .path("/api/auth/refresh")
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }

    private ResponseCookie clearLegacyJwtCookie(HttpServletRequest httpRequest) {
        return ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(httpRequest.isSecure())
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(userService.register(request));
        } catch (RuntimeException ex) {
            if ("INVALID_ROLE".equals(ex.getMessage())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("INVALID_ROLE");
            }
            throw ex;
        }
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me() {
        return ResponseEntity.ok(userService.me());
    }

    @PostMapping("/logout")
    @Transactional
    public ResponseEntity<String> logout(HttpServletRequest httpRequest, HttpServletResponse response) {
        String refreshRaw = null;
        if (httpRequest.getCookies() != null) {
            for (var c : httpRequest.getCookies()) {
                if ("refreshToken".equals(c.getName())) {
                    refreshRaw = c.getValue();
                    break;
                }
            }
        }

        if (refreshRaw != null && !refreshRaw.isBlank()) {
            String hash = hashToken(refreshRaw);
            refreshTokenRepository.findByTokenHash(hash).ifPresent(t -> {
                if (t.getRevokedAt() == null) {
                    t.setRevokedAt(Instant.now());
                    refreshTokenRepository.save(t);
                }
            });
        }

        response.addHeader("Set-Cookie", clearAccessCookie(httpRequest).toString());
        response.addHeader("Set-Cookie", clearRefreshCookie(httpRequest).toString());
        response.addHeader("Set-Cookie", clearLegacyJwtCookie(httpRequest).toString());
        return ResponseEntity.ok("Logged out");
    }

    @PostMapping("/login")
    @Transactional
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        try {
            AuthResponse authResponse = userService.login(request);

            String email = authResponse.getEmail();
            String accessJwt = jwtTokenProvider.generateAccessToken(email);

            String refreshRaw = generateRefreshToken();
            String refreshHash = hashToken(refreshRaw);

            var user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));

            RefreshToken refreshToken = new RefreshToken();
            refreshToken.setUser(user);
            refreshToken.setTokenHash(refreshHash);
            refreshToken.setCreatedAt(Instant.now());
            refreshToken.setExpiresAt(Instant.now().plusMillis(refreshExpirationMs));
            refreshTokenRepository.save(refreshToken);

            response.addHeader("Set-Cookie", buildAccessCookie(accessJwt, httpRequest).toString());
            response.addHeader("Set-Cookie", buildRefreshCookie(refreshRaw, httpRequest).toString());

            return ResponseEntity.ok(authResponse);
        } catch (RuntimeException ex) {
            if ("ACCOUNT_BLOCKED".equals(ex.getMessage())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("ACCOUNT_BLOCKED");
            }
            if ("EMAIL_NOT_VERIFIED".equals(ex.getMessage())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("EMAIL_NOT_VERIFIED");
            }
            if ("INVALID_ROLE".equals(ex.getMessage())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("INVALID_ROLE");
            }
            throw ex;
        }
    }

    @PostMapping("/refresh")
    @Transactional
    public ResponseEntity<?> refresh(HttpServletRequest httpRequest, HttpServletResponse response) {
        String refreshRaw = null;
        if (httpRequest.getCookies() != null) {
            for (var c : httpRequest.getCookies()) {
                if ("refreshToken".equals(c.getName())) {
                    refreshRaw = c.getValue();
                    break;
                }
            }
        }

        if (refreshRaw == null || refreshRaw.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("NO_REFRESH_TOKEN");
        }

        String refreshHash = hashToken(refreshRaw);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(refreshHash)
                .orElse(null);
        if (stored == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("INVALID_REFRESH_TOKEN");
        }

        Instant now = Instant.now();
        if (stored.getRevokedAt() != null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("REFRESH_TOKEN_REVOKED");
        }
        if (stored.getExpiresAt() == null || !stored.getExpiresAt().isAfter(now)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("REFRESH_TOKEN_EXPIRED");
        }

        // rotation
        String newRefreshRaw = generateRefreshToken();
        String newRefreshHash = hashToken(newRefreshRaw);

        RefreshToken replacement = new RefreshToken();
        replacement.setUser(stored.getUser());
        replacement.setTokenHash(newRefreshHash);
        replacement.setCreatedAt(now);
        replacement.setExpiresAt(now.plusMillis(refreshExpirationMs));
        refreshTokenRepository.save(replacement);

        stored.setRevokedAt(now);
        stored.setReplacedByTokenHash(newRefreshHash);
        refreshTokenRepository.save(stored);

        String email = stored.getUser().getEmail();
        String accessJwt = jwtTokenProvider.generateAccessToken(email);

        response.addHeader("Set-Cookie", buildAccessCookie(accessJwt, httpRequest).toString());
        response.addHeader("Set-Cookie", buildRefreshCookie(newRefreshRaw, httpRequest).toString());

        return ResponseEntity.ok("REFRESHED");
    }

    @PostMapping("/request-otp")
    public ResponseEntity<String> requestOtp(@Valid @RequestBody OtpRequest req) {
        return ResponseEntity.ok(userService.sendOtpToEmail(req.getEmail()));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@Valid @RequestBody OtpVerificationRequest req) {
        userService.verifyOtp(req.getEmail(), req.getOtp());
        return ResponseEntity.ok("OTP verified");
    }

    @PostMapping("/verify-email-otp")
    public ResponseEntity<String> verifyEmailOtp(@Valid @RequestBody OtpVerificationRequest req) {
        return ResponseEntity.ok(userService.verifyRecruiterEmailOtp(req.getEmail(), req.getOtp()));
    }

    @PostMapping("/resend-email-otp")
    public ResponseEntity<String> resendEmailOtp(@Valid @RequestBody OtpRequest req) {
        return ResponseEntity.ok(userService.resendRecruiterEmailOtp(req.getEmail()));
    }

    @PostMapping("/reset-password-otp")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordWithOtpRequest req) {
        return ResponseEntity.ok(userService.resetPasswordWithOtp(req.getEmail(), req.getOtp(), req.getNewPassword()));
    }
}
