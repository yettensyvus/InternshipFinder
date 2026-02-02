package xyz.yettensyvus.internshipfinder.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class AdminStudentDetailsDTO {
    private Long id;
    private String name;
    private String phone;
    private String college;
    private String branch;
    private String yearOfPassing;
    private String resumeUrl;
    private String profilePictureUrl;
}
