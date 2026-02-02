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

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(toEmail);
            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress);
            }
            helper.setSubject(safeSubject);
            helper.setText(plainText, html);
            mailSender.send(mimeMessage);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to send OTP email", ex);
        }
    }
}
