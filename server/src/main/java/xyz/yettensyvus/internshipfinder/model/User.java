package xyz.yettensyvus.internshipfinder.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import xyz.yettensyvus.internshipfinder.enums.Role;

import java.util.Date;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "users", uniqueConstraints = {@UniqueConstraint(columnNames = "email")})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String profilePictureUrl;

    private boolean enabled = true;

    @Column(name = "pending_email")
    private String pendingEmail;

    @Column(name = "otp_code")
    private String otpCode;

    @Column(name = "otp_expiry")
    private Date otpExpiry;

}
