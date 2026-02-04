package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.dto.RecruiterApplicationDTO;
import xyz.yettensyvus.internshipfinder.dto.RecruiterStudentDTO;
import xyz.yettensyvus.internshipfinder.model.Application;
import xyz.yettensyvus.internshipfinder.enums.Status;
import xyz.yettensyvus.internshipfinder.service.ApplicationService;
import xyz.yettensyvus.internshipfinder.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/recruiter")
@CrossOrigin
public class RecruiterApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private FileUploadService fileUploadService;

    @GetMapping("/applications/{jobId}")
    public ResponseEntity<List<RecruiterApplicationDTO>> getApplicationsForJob(@PathVariable Long jobId, Principal principal) {
        List<Application> apps = applicationService.getApplicationsByJobForRecruiter(principal.getName(), jobId);
        List<RecruiterApplicationDTO> dto = apps.stream().map(app -> {
            RecruiterStudentDTO student = null;
            if (app.getStudent() != null && app.getStudent().getUser() != null) {
                student = new RecruiterStudentDTO(
                        app.getStudent().getId(),
                        app.getStudent().getName(),
                        app.getStudent().getUser().getEmail(),
                        app.getStudent().getPhone(),
                        app.getStudent().getCollege(),
                        app.getStudent().getBranch(),
                        app.getStudent().getYearOfPassing(),
                        fileUploadService.toReadSasUrl(app.getStudent().getResumeUrl()),
                        fileUploadService.toReadSasUrl(app.getStudent().getUser().getProfilePictureUrl())
                );
            }

            Long jobIdValue = app.getJob() != null ? app.getJob().getId() : null;
            String jobTitle = app.getJob() != null ? app.getJob().getTitle() : null;
            String jobCompany = app.getJob() != null ? app.getJob().getCompany() : null;

            return new RecruiterApplicationDTO(
                    app.getId(),
                    app.getStatus(),
                    app.getAppliedAt(),
                    jobIdValue,
                    jobTitle,
                    jobCompany,
                    student
            );
        }).toList();

        return ResponseEntity.ok(dto);
    }

    @PutMapping("/applications/{applicationId}")
    public ResponseEntity<Application> updateApplicationStatus(
            @PathVariable Long applicationId,
            @RequestParam String status,
            Principal principal
    ) {
        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (normalized.equals("SHORTLISTED") || normalized.equals("SHORTLIST")) {
            normalized = "SHORTLISTED";
        }
        if (normalized.equals("REJECTED") || normalized.equals("REJECT")) {
            normalized = "REJECTED";
        }
        Status newStatus = Status.valueOf(normalized);
        return ResponseEntity.ok(applicationService.updateApplicationStatusForRecruiter(principal.getName(), applicationId, newStatus));
    }
}
