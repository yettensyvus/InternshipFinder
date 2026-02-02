package xyz.yettensyvus.internshipfinder.service.impl;

import xyz.yettensyvus.internshipfinder.dto.AuthResponse;
import xyz.yettensyvus.internshipfinder.dto.LoginRequest;
import xyz.yettensyvus.internshipfinder.dto.RegisterRequest;
import xyz.yettensyvus.internshipfinder.enums.NotificationType;
import xyz.yettensyvus.internshipfinder.enums.Role;
import xyz.yettensyvus.internshipfinder.model.*;
import xyz.yettensyvus.internshipfinder.repository.RecruiterRepository;
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

        String otp = String.valueOf(new Random().nextInt(900000) + 100000); // 6-digit OTP
        user.setOtpCode(otp);
        user.setOtpExpiry(new Date(System.currentTimeMillis() + 5 * 60 * 1000)); // 5 min expiry
        userRepo.save(user);

        emailService.sendOtpEmail(normalizedEmail, otp);
        return "OTP sent to your email.";
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepo.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (user.getOtpCode() == null || user.getOtpExpiry() == null) {
            throw new RuntimeException("OTP expired");
        }

        if (!otp.equals(user.getOtpCode())) {
            throw new RuntimeException("Invalid OTP");
        }

        if (user.getOtpExpiry().before(new Date())) {
            throw new RuntimeException("OTP expired");
        }

        return true;
    }

    @Override
    public String resetPasswordWithOtp(String email, String otp, String newPassword) {
        String normalizedEmail = normalizeEmail(email);
        verifyOtp(normalizedEmail, otp);

        User user = userRepo.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepo.save(user);

        return "Password reset successfully.";
    }

    // Registration
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
            String otp = String.valueOf(new Random().nextInt(900000) + 100000);
            user.setOtpCode(otp);
            user.setOtpExpiry(new Date(System.currentTimeMillis() + 5 * 60 * 1000));
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

            emailService.sendRecruiterEmailVerificationOtpEmail(user.getEmail(), user.getOtpCode());
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
        verifyOtp(normalizedEmail, otp);

        User user = userRepo.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (user.getRole() != Role.RECRUITER) {
            throw new RuntimeException("INVALID_ROLE");
        }

        user.setEnabled(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
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

        String otp = String.valueOf(new Random().nextInt(900000) + 100000);
        user.setOtpCode(otp);
        user.setOtpExpiry(new Date(System.currentTimeMillis() + 5 * 60 * 1000));
        userRepo.save(user);

        emailService.sendRecruiterEmailVerificationOtpEmail(user.getEmail(), otp);
        return "OTP sent";
    }

    // Settings: change email (OTP sent to new email)
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

        String otp = String.valueOf(new Random().nextInt(900000) + 100000);
        user.setPendingEmail(normalizedEmail);
        user.setOtpCode(otp);
        user.setOtpExpiry(new Date(System.currentTimeMillis() + 5 * 60 * 1000));
        userRepo.save(user);

        emailService.sendOtpEmail(normalizedEmail, otp);
        return "OTP sent to new email";
    }

    @Override
    public String confirmEmailChange(String otp) {
        User user = getCurrentUser();

        if (user.getPendingEmail() == null || user.getPendingEmail().trim().isEmpty()) {
            throw new RuntimeException("No pending email change");
        }

        verifyOtp(user.getEmail(), otp);

        String newEmail = user.getPendingEmail();
        if (userRepo.existsByEmail(newEmail)) {
            throw new RuntimeException("Email already registered");
        }

        user.setEmail(newEmail);
        user.setPendingEmail(null);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepo.save(user);

        return "Email changed";
    }

    // Settings: change password (OTP sent to current email)
    @Override
    public String requestPasswordChange(String currentPassword) {
        User user = getCurrentUser();

        if (currentPassword == null || currentPassword.trim().isEmpty()) {
            throw new RuntimeException("Invalid password");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("INVALID_PASSWORD");
        }

        String otp = String.valueOf(new Random().nextInt(900000) + 100000);
        user.setOtpCode(otp);
        user.setOtpExpiry(new Date(System.currentTimeMillis() + 5 * 60 * 1000));
        userRepo.save(user);

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

        verifyOtp(user.getEmail(), otp);

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepo.save(user);

        return "Password changed";
    }

    // Login
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
        String avatar = null;

        if (user.getRole() == Role.STUDENT) {
            Student s = studentRepo.findByUserEmail(user.getEmail()).orElse(null);
            if (s != null) {
                if (s.getName() != null && !s.getName().isBlank()) {
                    name = s.getName();
                }
                avatar = fileUploadService.toReadSasUrl(s.getProfilePictureUrl());
            }
        } else if (user.getRole() == Role.RECRUITER) {
            Recruiter r = recruiterRepo.findByUserEmail(user.getEmail());
            if (r != null) {
                if (r.getCompanyName() != null && !r.getCompanyName().isBlank()) {
                    name = r.getCompanyName();
                }
                avatar = fileUploadService.toReadSasUrl(r.getProfilePictureUrl());
            }
        } else if (user.getRole() == Role.ADMIN) {
            avatar = fileUploadService.toReadSasUrl(user.getProfilePictureUrl());
        }

        return new AuthResponse(token, user.getEmail(), user.getRole().name(), name, avatar);
    }
}
