package xyz.yettensyvus.internshipfinder.service.impl;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import xyz.yettensyvus.internshipfinder.service.EmailService;

@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String fromAddress;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${spring.mail.password:}")
    private String smtpPassword;

    @Value("${app.mail.brandName:Internship Finder}")
    private String brandName;

    @Value("${app.mail.logoUrl:}")
    private String logoUrl;

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        if (smtpUsername == null || smtpUsername.isBlank()) {
            throw new IllegalStateException("SMTP username is missing. Set SMTP_USERNAME (or spring.mail.username).");
        }

        if (smtpPassword == null || smtpPassword.isBlank()) {
            throw new IllegalStateException("SMTP password is missing. Set SMTP_PASSWORD (or spring.mail.password). For Gmail you must use an App Password.");
        }

        sendOtpEmailInternal(toEmail, otp, "Password reset request", "We received a request to reset the password for", brandName + " | Password Reset OTP");
    }

    @Override
    public void sendRecruiterEmailVerificationOtpEmail(String toEmail, String otp) {
        sendOtpEmailInternal(toEmail, otp, "Verify your email", "Thanks for registering. Please verify your email for", brandName + " | Verify Email OTP");
    }

    @Override
    public void sendInterviewInvitation(String toEmail, String studentName, String jobTitle, String companyName, String date, String location, String recruiterEmail) {
        try {
            String safeBrandName = (brandName == null || brandName.isBlank()) ? "Internship Finder" : brandName;
            String subject = safeBrandName + " | Interview Invitation - " + jobTitle;
            
            String plainText = "Hello " + studentName + ",\n\n"
                    + "We are pleased to invite you for an interview for the position: " + jobTitle + " at " + companyName + ".\n\n"
                    + "Details:\n"
                    + "Date & Time: " + date + "\n"
                    + "Location/Link: " + location + "\n\n"
                    + "If you have any questions, you can contact the recruiter at: " + recruiterEmail + "\n\n"
                    + "Good luck!\n"
                    + companyName + " Team via " + safeBrandName;

            String headerLogoHtml = getHeaderLogoHtml(safeBrandName);

            String html = "<!doctype html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/></head>"
                    + "<body style=\"margin:0; padding:0; background:#f6f7fb; font-family:Arial, sans-serif; color:#111827;\">"
                    + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f6f7fb; padding:24px 12px;\">"
                    + "  <tr><td align=\"center\">"
                    + "    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px; width:100%; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 10px 30px rgba(17,24,39,0.08);\">"
                    + "      <tr><td style=\"padding:18px 22px; background:linear-gradient(90deg,#8b5cf6,#6366f1,#3b82f6); color:#ffffff;\">"
                    + "        <table role=\"presentation\" width=\"100%\"><tr><td>" + headerLogoHtml + "</td><td align=\"right\" style=\"font-size:12px; opacity:0.9;\">Interview Invitation</td></tr></table>"
                    + "      </td></tr>"
                    + "      <tr><td style=\"padding:30px 24px;\">"
                    + "        <h1 style=\"margin:0 0 16px 0; font-size:22px; line-height:1.3; color:#111827;\">Hello " + studentName + ",</h1>"
                    + "        <p style=\"margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#4b5563;\">We are pleased to invite you for an interview for the <strong>" + jobTitle + "</strong> position at <strong>" + companyName + "</strong>.</p>"
                    + "        <div style=\"margin:24px 0; padding:20px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px;\">"
                    + "          <p style=\"margin:0 0 10px 0; font-size:14px;\">📅 <strong>Date & Time:</strong> " + date + "</p>"
                    + "          <p style=\"margin:0; font-size:14px;\">📍 <strong>Location/Link:</strong> " + location + "</p>"
                    + "        </div>"
                    + "        <p style=\"margin:20px 0 0 0; font-size:14px; color:#4b5563;\">If you have any questions, you can contact the recruiter at: <a href=\"mailto:" + recruiterEmail + "\" style=\"color:#6366f1; text-decoration:none; font-weight:bold;\">" + recruiterEmail + "</a></p>"
                    + "      </td></tr>"
                    + "      <tr><td style=\"padding:16px 22px; background:#f9fafb; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280;\">"
                    + "        © " + safeBrandName + " • This is an automated message from " + companyName + "."
                    + "      </td></tr>"
                    + "    </table>"
                    + "  </td></tr>"
                    + "</table></body></html>";

            sendHtmlEmail(toEmail, subject, plainText, html);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to send interview email", ex);
        }
    }

    @Override
    public void sendHiringConfirmation(String toEmail, String studentName, String jobTitle, String companyName, String recruiterEmail) {
        try {
            String safeBrandName = (brandName == null || brandName.isBlank()) ? "Internship Finder" : brandName;
            String subject = "Congratulations! You are hired - " + jobTitle;
            
            String plainText = "Hello " + studentName + ",\n\n"
                    + "Congratulations! We are happy to inform you that you have been selected for the position: " + jobTitle + " at " + companyName + ".\n\n"
                    + "Welcome to the team!\n\n"
                    + "For further steps, you can contact your recruiter at: " + recruiterEmail + "\n\n"
                    + companyName + " Team via " + safeBrandName;

            String headerLogoHtml = getHeaderLogoHtml(safeBrandName);

            String html = "<!doctype html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/></head>"
                    + "<body style=\"margin:0; padding:0; background:#f6f7fb; font-family:Arial, sans-serif; color:#111827;\">"
                    + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f6f7fb; padding:24px 12px;\">"
                    + "  <tr><td align=\"center\">"
                    + "    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px; width:100%; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 10px 30px rgba(17,24,39,0.08);\">"
                    + "      <tr><td style=\"padding:18px 22px; background:linear-gradient(90deg,#10b981,#059669); color:#ffffff;\">"
                    + "        <table role=\"presentation\" width=\"100%\"><tr><td>" + headerLogoHtml + "</td><td align=\"right\" style=\"font-size:12px; opacity:0.9;\">Congratulations!</td></tr></table>"
                    + "      </td></tr>"
                    + "      <tr><td style=\"padding:30px 24px;\">"
                    + "        <h1 style=\"margin:0 0 16px 0; font-size:24px; line-height:1.3; color:#059669;\">You are Hired! 🎉</h1>"
                    + "        <p style=\"margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#4b5563;\">Hello <strong>" + studentName + "</strong>,</p>"
                    + "        <p style=\"margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#4b5563;\">We are thrilled to inform you that you have been selected for the <strong>" + jobTitle + "</strong> position at <strong>" + companyName + "</strong>.</p>"
                    + "        <p style=\"margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#4b5563;\">Welcome to the team! For further details and next steps, please contact your recruiter.</p>"
                    + "        <div style=\"margin:24px 0; padding:16px; background:#ecfdf5; border:1px solid #d1fae5; border-radius:12px;\">"
                    + "          <p style=\"margin:0; font-size:14px; color:#065f46;\">📧 <strong>Recruiter Contact:</strong> <a href=\"mailto:" + recruiterEmail + "\" style=\"color:#059669; text-decoration:none; font-weight:bold;\">" + recruiterEmail + "</a></p>"
                    + "        </div>"
                    + "      </td></tr>"
                    + "      <tr><td style=\"padding:16px 22px; background:#f9fafb; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280;\">"
                    + "        © " + safeBrandName + " • This is an automated message from " + companyName + "."
                    + "      </td></tr>"
                    + "    </table>"
                    + "  </td></tr>"
                    + "</table></body></html>";

            sendHtmlEmail(toEmail, subject, plainText, html);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to send hiring email", ex);
        }
    }

    private String getHeaderLogoHtml(String safeBrandName) {
        if (logoUrl != null && !logoUrl.isBlank()) {
            return "<img src=\"" + logoUrl + "\" alt=\"" + safeBrandName + "\" style=\"height:32px; width:auto; display:block;\"/>";
        } else {
            return "<div style=\"font-size:20px; font-weight:800; letter-spacing:0.2px; color:#ffffff !important;\">" + safeBrandName + "</div>";
        }
    }

    private void sendHtmlEmail(String toEmail, String subject, String plainText, String html) throws Exception {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
        helper.setTo(toEmail);
        if (fromAddress != null && !fromAddress.isBlank()) {
            helper.setFrom(fromAddress);
        }
        helper.setSubject(subject);
        helper.setText(plainText, html);
        mailSender.send(mimeMessage);
    }

    private void sendOtpEmailInternal(String toEmail, String otp, String title, String introText, String subject) {
        if (smtpUsername == null || smtpUsername.isBlank()) {
            throw new IllegalStateException("SMTP username is missing. Set SMTP_USERNAME (or spring.mail.username).");
        }

        if (smtpPassword == null || smtpPassword.isBlank()) {
            throw new IllegalStateException("SMTP password is missing. Set SMTP_PASSWORD (or spring.mail.password). For Gmail you must use an App Password.");
        }

        try {
            String safeBrandName = (brandName == null || brandName.isBlank()) ? "Internship Finder" : brandName;
            String safeOtp = (otp == null) ? "" : otp;
            String safeToEmail = (toEmail == null) ? "" : toEmail;
            String safeTitle = (title == null || title.isBlank()) ? "Security code" : title;
            String safeIntroText = (introText == null || introText.isBlank()) ? "We received a request for" : introText;
            String safeSubject = (subject == null || subject.isBlank()) ? (safeBrandName + " | OTP") : subject;

            String plainText = "Hello,\n\n"
                    + safeIntroText + ": " + safeToEmail + "\n\n"
                    + "Your OTP code is: " + safeOtp + "\n"
                    + "This OTP will expire in 5 minutes.\n\n"
                    + "If you didn't request this, you can safely ignore this email.\n\n"
                    + safeBrandName + " Team";

            String headerLogoHtml;
            if (logoUrl != null && !logoUrl.isBlank()) {
                headerLogoHtml = "<img src=\"" + logoUrl + "\" alt=\"" + safeBrandName + "\" style=\"height:40px; width:auto; display:block;\"/>";
            } else {
                headerLogoHtml = "<div style=\"font-size:22px; font-weight:800; letter-spacing:0.2px; color:#ffffff !important;\">" + safeBrandName + "</div>";
            }

            String html = "" +
                    "<!doctype html>" +
                    "<html><head><meta charset=\"utf-8\"/>" +
                    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>" +
                    "</head>" +
                    "<body style=\"margin:0; padding:0; background:#f6f7fb; font-family:Arial, Helvetica, sans-serif; color:#111827;\">" +
                    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f6f7fb; padding:24px 12px;\">" +
                    "  <tr><td align=\"center\">" +
                    "    <table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:600px; width:100%; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 10px 30px rgba(17,24,39,0.08);\">" +
                    "      <tr>" +
                    "        <td style=\"padding:18px 22px; background:linear-gradient(90deg,#8b5cf6,#6366f1,#3b82f6); color:#ffffff;\">" +
                    "          <table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">" +
                    "            <tr>" +
                    "              <td align=\"left\" style=\"vertical-align:middle;\">" + headerLogoHtml + "</td>" +
                    "              <td align=\"right\" style=\"vertical-align:middle;\">" +
                    "                <div style=\"font-size:12px; color:rgba(255,255,255,0.95);\">Security Code</div>" +
                    "              </td>" +
                    "            </tr>" +
                    "          </table>" +
                    "        </td>" +
                    "      </tr>" +
                    "      <tr>" +
                    "        <td style=\"padding:22px;\">" +
                    "          <h1 style=\"margin:0 0 8px 0; font-size:20px; line-height:1.3;\">" + safeTitle + "</h1>" +
                    "          <p style=\"margin:0 0 14px 0; color:#4b5563; font-size:14px; line-height:1.6;\">" +
                    "            " + safeIntroText + " <b>" + safeToEmail + "</b>." +
                    "          </p>" +
                    "          <div style=\"margin:18px 0; padding:16px; border:1px solid #e5e7eb; background:#f9fafb; border-radius:12px;\">" +
                    "            <div style=\"font-size:12px; color:#6b7280; margin-bottom:8px;\">Your One-Time Password (OTP)</div>" +
                    "            <div style=\"font-size:28px; letter-spacing:6px; font-weight:800; color:#111827;\">" + safeOtp + "</div>" +
                    "            <div style=\"margin-top:10px; font-size:12px; color:#6b7280;\">Expires in <b>5 minutes</b>.</div>" +
                    "          </div>" +
                    "          <p style=\"margin:0; color:#4b5563; font-size:13px; line-height:1.6;\">" +
                    "            If you didn’t request this, you can safely ignore this email. For your security, please do not share this code with anyone." +
                    "          </p>" +
                    "        </td>" +
                    "      </tr>" +
                    "      <tr>" +
                    "        <td style=\"padding:16px 22px; background:#f9fafb; border-top:1px solid #e5e7eb;\">" +
                    "          <div style=\"font-size:12px; color:#6b7280; line-height:1.6;\">" +
                    "            © " + safeBrandName + " • This is an automated message, please do not reply." +
                    "          </div>" +
                    "        </td>" +
                    "      </tr>" +
                    "    </table>" +
                    "  </td></tr>" +
                    "</table>" +
                    "</body></html>";

            sendHtmlEmail(toEmail, safeSubject, plainText, html);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to send OTP email", ex);
        }
    }
}
