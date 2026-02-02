package xyz.yettensyvus.internshipfinder.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class ConfirmEmailChangeRequest {
    @NotBlank(message = "OTP is required")
    private String otp;
}
