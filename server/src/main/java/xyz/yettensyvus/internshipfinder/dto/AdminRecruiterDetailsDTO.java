package xyz.yettensyvus.internshipfinder.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class AdminRecruiterDetailsDTO {
    private Long id;
    private String companyName;
    private String companyWebsite;
    private String profilePictureUrl;
}
