package xyz.yettensyvus.internshipfinder.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String phone;
    private String college;
    private String branch;
    private String yearOfPassing;

    private String resumeUrl;

    private String profilePictureUrl;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
