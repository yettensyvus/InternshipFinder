package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.dto.*;
import xyz.yettensyvus.internshipfinder.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private UserService userService;

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

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest httpRequest, HttpServletResponse response) {
        ResponseCookie jwtCookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(httpRequest.isSecure())
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader("Set-Cookie", jwtCookie.toString());
        return ResponseEntity.ok("Logged out");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        try {
            AuthResponse authResponse = userService.login(request);

            ResponseCookie jwtCookie = ResponseCookie.from("jwt", authResponse.getToken())
                    .httpOnly(true)
                    .secure(httpRequest.isSecure())
                    .path("/")
                    .maxAge(24 * 60 * 60)
                    .sameSite("Lax")
                    .build();
            response.addHeader("Set-Cookie", jwtCookie.toString());

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
