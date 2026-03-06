package xyz.yettensyvus.internshipfinder.service;


public interface EmailService {

    void sendOtpEmail(String toEmail, String otp);

    void sendRecruiterEmailVerificationOtpEmail(String toEmail, String otp);

    void sendInterviewInvitation(String toEmail, String studentName, String jobTitle, String companyName, String date, String location, String recruiterEmail);

    void sendHiringConfirmation(String toEmail, String studentName, String jobTitle, String companyName, String recruiterEmail);
}
