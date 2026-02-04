package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.dto.JobDetailsResponse;
import xyz.yettensyvus.internshipfinder.model.Job;
import xyz.yettensyvus.internshipfinder.repository.JobRepository;
import xyz.yettensyvus.internshipfinder.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class PublicJobController {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private FileUploadService fileUploadService;

    @GetMapping("/jobs")
    public ResponseEntity<List<Job>> getAllActiveJobs(@RequestParam(required = false) Boolean paid) {
        if (paid == null) {
            return ResponseEntity.ok(jobRepository.findByIsActiveTrue());
        }
        return ResponseEntity.ok(jobRepository.findByIsActiveTrueAndPaid(paid));
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<JobDetailsResponse> getJobById(@PathVariable Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        String recruiterCompany = null;
        String recruiterEmail = null;
        String recruiterProfilePictureUrl = null;
        if (job.getRecruiter() != null) {
            recruiterCompany = job.getRecruiter().getCompanyName();
            if (job.getRecruiter().getUser() != null) {
                recruiterEmail = job.getRecruiter().getUser().getEmail();
            }
            if (job.getRecruiter().getUser() != null) {
                recruiterProfilePictureUrl = fileUploadService.toReadSasUrl(job.getRecruiter().getUser().getProfilePictureUrl());
            }
        }

        JobDetailsResponse dto = new JobDetailsResponse(
                job.getId(),
                job.getTitle(),
                job.getCompany(),
                job.getLocation(),
                job.getDescription(),
                job.getDeadline(),
                job.getType(),
                job.isPaid(),
                job.getDuration(),
                job.getCompensation(),
                job.isActive(),
                job.getCreatedAt(),
                recruiterCompany,
                recruiterEmail,
                recruiterProfilePictureUrl
        );

        return ResponseEntity.ok(dto);
    }
}
