package xyz.yettensyvus.internshipfinder.service;


public interface EmailService {

    void sendOtpEmail(String toEmail, String otp);

    void sendRecruiterEmailVerificationOtpEmail(String toEmail, String otp);
}
