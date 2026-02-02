package xyz.yettensyvus.internshipfinder.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class AuthResponse {
    private String token;
    private String email;
    private String role;
    private String name;
    private String avatar;
}
