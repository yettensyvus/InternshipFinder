package xyz.yettensyvus.internshipfinder.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class JobResponse {
    private Long id;
    private String title;
    private String description;
    private String type;
    private boolean isActive;
    private String recruiterName;
}
