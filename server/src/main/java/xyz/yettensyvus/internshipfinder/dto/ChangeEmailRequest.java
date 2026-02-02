package xyz.yettensyvus.internshipfinder.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
public class ChangeEmailRequest {
    @NotBlank(message = "New email is required")
    @Email(message = "Email must be valid")
    private String newEmail;
}
