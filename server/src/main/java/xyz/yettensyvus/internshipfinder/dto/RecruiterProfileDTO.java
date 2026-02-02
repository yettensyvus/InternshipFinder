package xyz.yettensyvus.internshipfinder.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class RecruiterProfileDTO {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Company name is required")
    @Size(min = 2, message = "Company name is too short")
    private String companyName;

    @Size(min = 4, message = "Company website is too short")
    private String companyWebsite;
    private String profilePictureUrl;

}
