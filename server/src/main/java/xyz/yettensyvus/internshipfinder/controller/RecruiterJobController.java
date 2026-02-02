package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.dto.JobDetailsResponse;
import xyz.yettensyvus.internshipfinder.dto.RecruiterJobUpdateRequest;
import xyz.yettensyvus.internshipfinder.model.Job;
import xyz.yettensyvus.internshipfinder.service.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/recruiter")
@CrossOrigin
public class RecruiterJobController {

    @Autowired
    private JobService jobService;

    @PostMapping("/jobs")
    public ResponseEntity<JobDetailsResponse> postJob(@RequestBody Job job, Principal principal) {
        Job saved = jobService.postJob(job, principal.getName());
        return ResponseEntity.ok(jobService.getRecruiterJobDetails(principal.getName(), saved.getId()));
    }

    @PostMapping("/post-job")
    public ResponseEntity<JobDetailsResponse> postJobCompat(@RequestBody Job job, Principal principal) {
        Job saved = jobService.postJob(job, principal.getName());
        return ResponseEntity.ok(jobService.getRecruiterJobDetails(principal.getName(), saved.getId()));
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<JobDetailsResponse>> getMyJobs(Principal principal) {
        return ResponseEntity.ok(jobService.getJobsByRecruiterAsDetails(principal.getName()));
    }

    @GetMapping("/my-jobs")
    public ResponseEntity<List<JobDetailsResponse>> getMyJobsCompat(Principal principal) {
        return ResponseEntity.ok(jobService.getJobsByRecruiterAsDetails(principal.getName()));
    }

    @GetMapping("/jobs/{id}")
    public ResponseEntity<JobDetailsResponse> getRecruiterJob(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(jobService.getRecruiterJobDetails(principal.getName(), id));
    }

    @PutMapping("/jobs/{id}")
    public ResponseEntity<JobDetailsResponse> updateRecruiterJob(
            @PathVariable Long id,
            @Valid @RequestBody RecruiterJobUpdateRequest req,
            Principal principal
    ) {
        return ResponseEntity.ok(jobService.updateRecruiterJob(principal.getName(), id, req));
    }
}
