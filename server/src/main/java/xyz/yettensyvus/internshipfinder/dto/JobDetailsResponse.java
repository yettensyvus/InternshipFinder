package xyz.yettensyvus.internshipfinder.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class JobDetailsResponse {
    private Long id;
    private String title;
    private String company;
    private String location;
    private String description;
    private String deadline;
    private String type;
    private boolean paid;
    private String duration;
    private String compensation;
    private boolean isActive;
    private Date createdAt;

    private String recruiterCompanyName;
    private String recruiterEmail;
    private String recruiterProfilePictureUrl;
}
