package xyz.yettensyvus.internshipfinder.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class StudentProfileDTO {

    @NotBlank(message = "Name is required")
    @Size(min = 2, message = "Name is too short")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @Pattern(regexp = "^$|^[0-9+()\\-\\s]{6,20}$", message = "Phone is invalid")
    private String phone;
    private String college;
    private String branch;
    @Pattern(regexp = "^$|^[0-9]{4}$", message = "Year of passing is invalid")
    private String yearOfPassing;
    private String resumeUrl;
    private String profilePictureUrl;

}
