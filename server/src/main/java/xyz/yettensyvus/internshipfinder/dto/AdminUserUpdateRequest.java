package xyz.yettensyvus.internshipfinder.dto;

import lombok.Data;
import xyz.yettensyvus.internshipfinder.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

@Data
public class AdminUserUpdateRequest {
    @Size(min = 2, message = "Username is too short")
    private String username;

    @Email(message = "Email must be valid")
    private String email;
    private Boolean enabled;

    private Role role;

    private AdminStudentDetailsDTO student;
    private AdminRecruiterDetailsDTO recruiter;
}
