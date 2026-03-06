package xyz.yettensyvus.internshipfinder.dto;

import lombok.Data;

@Data
public class RecommendJobRequest {
    private Long studentId;
    private Long jobId;
}
