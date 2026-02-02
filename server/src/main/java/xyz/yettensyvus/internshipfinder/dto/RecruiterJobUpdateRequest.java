package xyz.yettensyvus.internshipfinder.dto;

import lombok.Data;
import jakarta.validation.constraints.Size;

@Data
public class RecruiterJobUpdateRequest {
    @Size(min = 3, message = "Title is too short")
    private String title;

    @Size(min = 2, message = "Company is too short")
    private String company;
    private String location;

    @Size(min = 20, message = "Description is too short")
    @Size(max = 5000, message = "Description is too long")
    private String description;
    private String deadline;
    private String type;
    private Boolean paid;
    private String duration;
    private String compensation;
    private Boolean active;
}
