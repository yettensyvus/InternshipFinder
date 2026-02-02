package xyz.yettensyvus.internshipfinder.service;

import xyz.yettensyvus.internshipfinder.dto.AuthResponse;
import xyz.yettensyvus.internshipfinder.dto.LoginRequest;
import xyz.yettensyvus.internshipfinder.dto.RegisterRequest;
 
public interface UserService {
 
    String sendOtpToEmail(String email);
 
    boolean verifyOtp(String email, String otp);
 
    String resetPasswordWithOtp(String email, String otp, String newPassword);
 
    String register(RegisterRequest req);
 
    String verifyRecruiterEmailOtp(String email, String otp);
 
    String resendRecruiterEmailOtp(String email);
 
    String requestEmailChange(String newEmail);
 
    String confirmEmailChange(String otp);
 
    String requestPasswordChange(String currentPassword);
 
    String confirmPasswordChange(String otp, String currentPassword, String newPassword);
 
    AuthResponse login(LoginRequest req);
 }
