package xyz.yettensyvus.internshipfinder.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import xyz.yettensyvus.internshipfinder.enums.Status;

import java.util.Date;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private Status status = Status.APPLIED;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "applied_at")
    private Date appliedAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "interview_at")
    private Date interviewAt;

    @Column(name = "interview_location")
    private String interviewLocation;

}
