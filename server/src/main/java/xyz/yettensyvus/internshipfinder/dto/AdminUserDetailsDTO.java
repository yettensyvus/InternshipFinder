package xyz.yettensyvus.internshipfinder.dto;

import xyz.yettensyvus.internshipfinder.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class AdminUserDetailsDTO {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private boolean enabled;

    private AdminStudentDetailsDTO student;
    private AdminRecruiterDetailsDTO recruiter;
}
