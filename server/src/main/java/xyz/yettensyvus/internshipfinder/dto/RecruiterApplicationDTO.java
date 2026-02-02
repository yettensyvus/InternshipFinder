package xyz.yettensyvus.internshipfinder.dto;

import xyz.yettensyvus.internshipfinder.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class RecruiterApplicationDTO {
    private Long id;
    private Status status;
    private Date appliedAt;
    private Long jobId;
    private String jobTitle;
    private String jobCompany;
    private RecruiterStudentDTO student;
}
