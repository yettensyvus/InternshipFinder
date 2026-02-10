package xyz.yettensyvus.internshipfinder.service.impl;

import xyz.yettensyvus.internshipfinder.dto.AuthResponse;
import xyz.yettensyvus.internshipfinder.dto.LoginRequest;
import xyz.yettensyvus.internshipfinder.dto.RegisterRequest;
import xyz.yettensyvus.internshipfinder.enums.NotificationType;
import xyz.yettensyvus.internshipfinder.enums.OtpPurpose;
import xyz.yettensyvus.internshipfinder.enums.Role;
import xyz.yettensyvus.internshipfinder.model.*;
import xyz.yettensyvus.internshipfinder.repository.RecruiterRepository;
import xyz.yettensyvus.internshipfinder.repository.OtpTokenRepository;
import xyz.yettensyvus.internshipfinder.repository.StudentRepository;
import xyz.yettensyvus.internshipfinder.repository.UserRepository;
import xyz.yettensyvus.internshipfinder.security.JwtTokenProvider;
import xyz.yettensyvus.internshipfinder.service.EmailService;
import xyz.yettensyvus.internshipfinder.service.FileUploadService;
import xyz.yettensyvus.internshipfinder.service.NotificationService;
import xyz.yettensyvus.internshipfinder.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class UserServiceImpl implements UserService {

    @Autowired private UserRepository userRepo;
    @Autowired private StudentRepository studentRepo;
    @Autowired private RecruiterRepository recruiterRepo;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuthenticationManager authManager;
    @Autowired private JwtTokenProvider jwtProvider;
    @Autowired private EmailService emailService;
    @Autowired private NotificationService notificationService;
    @Autowired private FileUploadService fileUploadService;
    @Autowired private OtpTokenRepository otpTokenRepo;

    private String normalizeEmail(String email) {
        if (email == null) return null;
        String v = email.trim().toLowerCase(Locale.ROOT);
        return v.isEmpty() ? null : v;
    }

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        String email;
        if (principal instanceof org.springframework.security.core.userdetails.User) {
            email = ((org.springframework.security.core.userdetails.User) principal).getUsername();
        } else {
            email = String.valueOf(principal);
        }

        return userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Override
    public String sendOtpToEmail(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null) {
            return "OTP sent to your email.";
        }

        User user = userRepo.findByEmail(normalizedEmail).orElse(null);
        if (user == null) {
            return "OTP sent to your email.";
        }

        String otp = createOrReplaceOtp(user, OtpPurpose.PASSWORD_RESET, null);
        emailService.sendOtpEmail(normalizedEmail, otp);
        return "OTP sent to your email.";
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepo.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        validateOtpOrThrow(user, OtpPurpose.PASSWORD_RESET, otp);
        return true;
    }

    @Override
    public String resetPasswordWithOtp(String email, String otp, String newPassword) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepo.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        consumeOtpOrThrow(user, OtpPurpose.PASSWORD_RESET, otp);

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        return "Password reset successfully.";
    }

    @Override
    public String register(RegisterRequest req) {
        String email = normalizeEmail(req.getEmail());
        if (email == null) {
            throw new RuntimeException("Invalid email");
        }
        if (userRepo.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }

        Role requestedRole;
        try {
            requestedRole = Role.valueOf(req.getRole().trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new RuntimeException("INVALID_ROLE");
        }
        if (requestedRole == Role.ADMIN) {
            throw new RuntimeException("INVALID_ROLE");
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(requestedRole);

        if (requestedRole == Role.RECRUITER) {
            user.setEnabled(false);
        } else {
            user.setEnabled(true);
        }

        user = userRepo.save(user);

        if (user.getRole() == Role.STUDENT) {
            Student student = new Student();
            student.setUser(user);
            student.setName(req.getName());
            student.setResumeUrl(req.getResumeUrl());
            studentRepo.save(student);
        } else if (user.getRole() == Role.RECRUITER) {
            Recruiter recruiter = new Recruiter();
            recruiter.setUser(user);
            recruiter.setCompanyName(req.getCompanyName());
            recruiter.setCompanyWebsite(req.getCompanyWebsite());
            recruiterRepo.save(recruiter);

            String otp = createOrReplaceOtp(user, OtpPurpose.RECRUITER_EMAIL_VERIFICATION, null);
            emailService.sendRecruiterEmailVerificationOtpEmail(user.getEmail(), otp);
            return "RECRUITER_OTP_SENT";
        }

        notificationService.createForAdmins(
                NotificationType.USER_REGISTERED,
                "New user registered",
                "A new user registered: " + user.getEmail() + " (" + user.getRole() + ")",
                user.getEmail(),
                null,
                null
        );

        return "Registered successfully";
    }

    @Override
    public String verifyRecruiterEmailOtp(String email, String otp) {
        String normalizedEmail = normalizeEmail(email);

        User user = userRepo.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (user.getRole() != Role.RECRUITER) {
            throw new RuntimeException("INVALID_ROLE");
        }

        consumeOtpOrThrow(user, OtpPurpose.RECRUITER_EMAIL_VERIFICATION, otp);

        user.setEnabled(true);
        userRepo.save(user);

        return "Email verified";
    }

    @Override
    public String resendRecruiterEmailOtp(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null) {
            return "OTP sent";
        }
        User user = userRepo.findByEmail(normalizedEmail).orElse(null);
        if (user == null) {
            return "OTP sent";
        }

        if (user.getRole() != Role.RECRUITER) {
            throw new RuntimeException("INVALID_ROLE");
        }

        if (user.isEnabled()) {
            return "Already verified";
        }

        String otp = createOrReplaceOtp(user, OtpPurpose.RECRUITER_EMAIL_VERIFICATION, null);
        emailService.sendRecruiterEmailVerificationOtpEmail(user.getEmail(), otp);
        return "OTP sent";
    }

    @Override
    public String requestEmailChange(String newEmail) {
        String normalizedEmail = normalizeEmail(newEmail);
        if (normalizedEmail == null) {
            throw new RuntimeException("Invalid email");
        }

        if (userRepo.existsByEmail(normalizedEmail)) {
            throw new RuntimeException("Email already registered");
        }

        User user = getCurrentUser();

        String otp = createOrReplaceOtp(user, OtpPurpose.EMAIL_CHANGE, normalizedEmail);
        emailService.sendOtpEmail(normalizedEmail, otp);
        return "OTP sent to new email";
    }

    @Override
    public String confirmEmailChange(String otp) {
        User user = getCurrentUser();

        OtpToken token = consumeOtpOrThrow(user, OtpPurpose.EMAIL_CHANGE, otp);
        String newEmail = normalizeEmail(token.getTargetEmail());
        if (newEmail == null) {
            throw new RuntimeException("No pending email change");
        }
        if (userRepo.existsByEmail(newEmail)) {
            throw new RuntimeException("Email already registered");
        }

        user.setEmail(newEmail);
        userRepo.save(user);

        return "Email changed";
    }

    @Override
    public String requestPasswordChange(String currentPassword) {
        User user = getCurrentUser();

        if (currentPassword == null || currentPassword.trim().isEmpty()) {
            throw new RuntimeException("Invalid password");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("INVALID_PASSWORD");
        }

        String otp = createOrReplaceOtp(user, OtpPurpose.PASSWORD_CHANGE, null);
        emailService.sendOtpEmail(user.getEmail(), otp);
        return "OTP sent";
    }

    @Override
    public String confirmPasswordChange(String otp, String currentPassword, String newPassword) {
        User user = getCurrentUser();

        if (currentPassword == null || currentPassword.trim().isEmpty()) {
            throw new RuntimeException("Invalid password");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("INVALID_PASSWORD");
        }

        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new RuntimeException("Invalid password");
        }

        consumeOtpOrThrow(user, OtpPurpose.PASSWORD_CHANGE, otp);

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        return "Password changed";
    }

    @Override
    public AuthResponse login(LoginRequest req) {
        String email = normalizeEmail(req.getEmail());
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, req.getPassword())
        );

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!user.isEnabled()) {
            if (user.getRole() == Role.RECRUITER) {
                throw new RuntimeException("EMAIL_NOT_VERIFIED");
            }
            throw new RuntimeException("ACCOUNT_BLOCKED");
        }

        String token = jwtProvider.generateToken(user.getEmail());

        String name = user.getUsername();

        if (user.getRole() == Role.STUDENT) {
            Student s = studentRepo.findByUserEmail(user.getEmail()).orElse(null);
            if (s != null && s.getName() != null && !s.getName().isBlank()) {
                name = s.getName();
            }
        } else if (user.getRole() == Role.RECRUITER) {
            Recruiter r = recruiterRepo.findByUserEmail(user.getEmail());
            if (r != null && r.getCompanyName() != null && !r.getCompanyName().isBlank()) {
                name = r.getCompanyName();
            }
        }

        String avatar = fileUploadService.toReadSasUrl(user.getProfilePictureUrl());

        return new AuthResponse(token, user.getEmail(), user.getRole().name(), name, avatar);
    }

    private String createOrReplaceOtp(User user, OtpPurpose purpose, String targetEmail) {
        String otp = String.valueOf(new Random().nextInt(900000) + 100000);

        OtpToken token = new OtpToken();
        token.setUser(user);
        token.setPurpose(purpose);
        token.setOtpCode(otp);
        token.setTargetEmail(targetEmail);
        token.setCreatedAt(Instant.now());
        token.setExpiresAt(Instant.now().plusSeconds(5 * 60));
        otpTokenRepo.save(token);

        return otp;
    }

    private OtpToken consumeOtpOrThrow(User user, OtpPurpose purpose, String otp) {
        Instant now = Instant.now();

        List<OtpToken> candidates = otpTokenRepo.findTop5ByUserAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(user, purpose);
        if (candidates.isEmpty()) {
            throw new RuntimeException("OTP not found");
        }

        OtpToken matching = null;
        for (OtpToken t : candidates) {
            if (t.getOtpCode() != null && t.getOtpCode().equals(otp)) {
                matching = t;
                break;
            }
        }

        if (matching == null) {
            throw new RuntimeException("Invalid OTP");
        }

        if (matching.getExpiresAt() == null || !matching.getExpiresAt().isAfter(now)) {
            throw new RuntimeException("OTP expired");
        }

        matching.setConsumedAt(now);
        return otpTokenRepo.save(matching);
    }

    private void validateOtpOrThrow(User user, OtpPurpose purpose, String otp) {
        Instant now = Instant.now();

        List<OtpToken> candidates = otpTokenRepo.findTop5ByUserAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(user, purpose);
        if (candidates.isEmpty()) {
            throw new RuntimeException("OTP not found");
        }

        OtpToken matching = null;
        for (OtpToken t : candidates) {
            if (t.getOtpCode() != null && t.getOtpCode().equals(otp)) {
                matching = t;
                break;
            }
        }

        if (matching == null) {
            throw new RuntimeException("Invalid OTP");
        }

        if (matching.getExpiresAt() == null || !matching.getExpiresAt().isAfter(now)) {
            throw new RuntimeException("OTP expired");
        }
    }
}
