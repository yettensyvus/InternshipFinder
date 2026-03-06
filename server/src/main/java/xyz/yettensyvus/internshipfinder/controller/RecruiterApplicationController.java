package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.dto.RecruiterApplicationDTO;
import xyz.yettensyvus.internshipfinder.dto.RecruiterStudentDTO;
import xyz.yettensyvus.internshipfinder.dto.RecommendJobRequest;
import xyz.yettensyvus.internshipfinder.enums.NotificationType;
import xyz.yettensyvus.internshipfinder.model.Application;
import xyz.yettensyvus.internshipfinder.model.Job;
import xyz.yettensyvus.internshipfinder.model.Recruiter;
import xyz.yettensyvus.internshipfinder.model.Student;
import xyz.yettensyvus.internshipfinder.enums.Status;
import xyz.yettensyvus.internshipfinder.repository.ApplicationRepository;
import xyz.yettensyvus.internshipfinder.repository.JobRepository;
import xyz.yettensyvus.internshipfinder.repository.RecruiterRepository;
import xyz.yettensyvus.internshipfinder.repository.StudentRepository;
import xyz.yettensyvus.internshipfinder.service.ApplicationService;
import xyz.yettensyvus.internshipfinder.dto.ScheduleInterviewRequest;
import xyz.yettensyvus.internshipfinder.service.EmailService;
import java.util.Date;
import java.text.SimpleDateFormat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import xyz.yettensyvus.internshipfinder.service.FileUploadService;
import xyz.yettensyvus.internshipfinder.service.NotificationService;

import java.security.Principal;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/recruiter")
@CrossOrigin
public class RecruiterApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private FileUploadService fileUploadService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private RecruiterRepository recruiterRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private EmailService emailService;

    @GetMapping("/students")
    public ResponseEntity<List<RecruiterStudentDTO>> getAllStudentsForRecruiter() {
        List<Student> students = studentRepository.findAll();

        List<RecruiterStudentDTO> dto = students.stream()
                .filter(s -> s != null && s.getUser() != null)
                .sorted(Comparator.comparing(s -> String.valueOf(s.getName() == null ? "" : s.getName()).toLowerCase()))
                .map(s -> {
                    List<Long> appliedJobIds = applicationRepository.findByStudent(s).stream()
                            .filter(app -> app.getJob() != null)
                            .map(app -> app.getJob().getId())
                            .toList();

                    return new RecruiterStudentDTO(
                        s.getId(),
                        s.getName(),
                        s.getUser().getEmail(),
                        s.getPhone(),
                        s.getCollege(),
                        s.getBranch(),
                        s.getYearOfPassing(),
                        fileUploadService.toReadSasUrl(s.getResumeUrl()),
                        fileUploadService.toReadSasUrl(s.getUser().getProfilePictureUrl()),
                        appliedJobIds
                    );
                })
                .toList();

        return ResponseEntity.ok(dto);
    }

    @PostMapping("/recommend-job")
    public ResponseEntity<String> recommendJobToStudent(@RequestBody RecommendJobRequest req, Principal principal) {
        if (req == null || req.getStudentId() == null || req.getJobId() == null) {
            throw new RuntimeException("Invalid request");
        }

        Recruiter recruiter = recruiterRepository.findByUserEmail(principal.getName());
        if (recruiter == null) {
            throw new RuntimeException("Recruiter not found");
        }

        Job job = jobRepository.findById(req.getJobId())
                .orElseThrow(() -> new RuntimeException("Job not found"));

        if (job.getRecruiter() == null || job.getRecruiter().getId() == null
                || !job.getRecruiter().getId().equals(recruiter.getId())) {
            throw new RuntimeException("Not allowed");
        }

        Student student = studentRepository.findById(req.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));
        if (student.getUser() == null) {
            throw new RuntimeException("Student user not found");
        }

        String jobTitle = job.getTitle() == null ? "a job" : job.getTitle();
        String company = job.getCompany() == null ? "" : job.getCompany();
        String title = "Job recommended";
        String message = jobTitle + (company.isBlank() ? "" : (" (" + company + ")"));

        notificationService.createForUserEntity(
                student.getUser(),
                NotificationType.JOB_RECOMMENDED,
                title,
                message,
                principal.getName(),
                job.getId(),
                null
        );

        return ResponseEntity.ok("RECOMMENDED");
    }

    @GetMapping("/applications/{jobId}")
    public ResponseEntity<List<RecruiterApplicationDTO>> getApplicationsForJob(@PathVariable Long jobId, Principal principal) {
        List<Application> apps = applicationService.getApplicationsByJobForRecruiter(principal.getName(), jobId);
        List<RecruiterApplicationDTO> dto = apps.stream().map(app -> {
            RecruiterStudentDTO studentDto = null;
            if (app.getStudent() != null && app.getStudent().getUser() != null) {
                List<Long> appliedJobIds = applicationRepository.findByStudent(app.getStudent()).stream()
                        .filter(a -> a.getJob() != null)
                        .map(a -> a.getJob().getId())
                        .toList();

                studentDto = new RecruiterStudentDTO(
                        app.getStudent().getId(),
                        app.getStudent().getName(),
                        app.getStudent().getUser().getEmail(),
                        app.getStudent().getPhone(),
                        app.getStudent().getCollege(),
                        app.getStudent().getBranch(),
                        app.getStudent().getYearOfPassing(),
                        fileUploadService.toReadSasUrl(app.getStudent().getResumeUrl()),
                        fileUploadService.toReadSasUrl(app.getStudent().getUser().getProfilePictureUrl()),
                        appliedJobIds
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
                    studentDto,
                    app.getInterviewAt(),
                    app.getInterviewLocation()
            );
        }).toList();

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/applications/shortlisted")
    public ResponseEntity<List<RecruiterApplicationDTO>> getShortlistedApplications(Principal principal) {
        return getApplicationsByStatus(principal, Status.SHORTLISTED);
    }

    @GetMapping("/applications/interviews")
    public ResponseEntity<List<RecruiterApplicationDTO>> getInterviewApplications(Principal principal) {
        return getApplicationsByStatus(principal, Status.INTERVIEW_SCHEDULED);
    }

    @GetMapping("/applications/hired")
    public ResponseEntity<List<RecruiterApplicationDTO>> getHiredApplications(Principal principal) {
        return getApplicationsByStatus(principal, Status.HIRED);
    }

    private ResponseEntity<List<RecruiterApplicationDTO>> getApplicationsByStatus(Principal principal, Status status) {
        Recruiter recruiter = recruiterRepository.findByUserEmail(principal.getName());
        if (recruiter == null) throw new RuntimeException("Recruiter not found");

        List<Application> apps = applicationRepository.findAll().stream()
                .filter(app -> app.getJob() != null && app.getJob().getRecruiter() != null &&
                        app.getJob().getRecruiter().getId().equals(recruiter.getId()) &&
                        app.getStatus() == status)
                .toList();

        List<RecruiterApplicationDTO> dto = apps.stream().map(app -> {
            RecruiterStudentDTO studentDto = null;
            if (app.getStudent() != null && app.getStudent().getUser() != null) {
                List<Long> appliedJobIds = applicationRepository.findByStudent(app.getStudent()).stream()
                        .filter(a -> a.getJob() != null)
                        .map(a -> a.getJob().getId())
                        .toList();

                studentDto = new RecruiterStudentDTO(
                        app.getStudent().getId(),
                        app.getStudent().getName(),
                        app.getStudent().getUser().getEmail(),
                        app.getStudent().getPhone(),
                        app.getStudent().getCollege(),
                        app.getStudent().getBranch(),
                        app.getStudent().getYearOfPassing(),
                        fileUploadService.toReadSasUrl(app.getStudent().getResumeUrl()),
                        fileUploadService.toReadSasUrl(app.getStudent().getUser().getProfilePictureUrl()),
                        appliedJobIds
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
                    studentDto,
                    app.getInterviewAt(),
                    app.getInterviewLocation()
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
        String email = principal.getName();
        Recruiter recruiter = recruiterRepository.findByUserEmail(email);
        if (recruiter == null) throw new RuntimeException("Recruiter not found");

        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (!app.getJob().getRecruiter().getId().equals(recruiter.getId())) {
            throw new RuntimeException("Not allowed to update this application");
        }

        String normalized = status == null ? "" : status.trim().toUpperCase();
        if (normalized.equals("SHORTLISTED") || normalized.equals("SHORTLIST")) {
            app.setStatus(Status.SHORTLISTED);
        } else if (normalized.equals("REJECTED")) {
            app.setStatus(Status.REJECTED);
        } else if (normalized.equals("HIRED")) {
            app.setStatus(Status.HIRED);
            
            emailService.sendHiringConfirmation(
                app.getStudent().getUser().getEmail(),
                app.getStudent().getName(),
                app.getJob().getTitle(),
                app.getJob().getCompany(),
                email
            );

            List<Application> otherApps = applicationRepository.findByStudent(app.getStudent());
            for (Application other : otherApps) {
                if (!other.getId().equals(app.getId()) && other.getStatus() != Status.HIRED) {
                    other.setStatus(Status.REJECTED);
                    applicationRepository.save(other);
                }
            }
        }

        return ResponseEntity.ok(applicationRepository.save(app));
    }

    @PostMapping("/applications/{applicationId}/schedule-interview")
    public ResponseEntity<Application> scheduleInterview(
            @PathVariable Long applicationId,
            @RequestBody ScheduleInterviewRequest req,
            Principal principal
    ) {
        String email = principal.getName();
        Recruiter recruiter = recruiterRepository.findByUserEmail(email);
        if (recruiter == null) throw new RuntimeException("Recruiter not found");

        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (!app.getJob().getRecruiter().getId().equals(recruiter.getId())) {
            throw new RuntimeException("Not allowed to schedule interview for this application");
        }

        if (app.getStatus() == Status.INTERVIEW_SCHEDULED) {
            throw new RuntimeException("Interview already scheduled");
        }

        app.setStatus(Status.INTERVIEW_SCHEDULED);
        app.setInterviewAt(req.getInterviewAt());
        app.setInterviewLocation(req.getLocation());

        Application saved = applicationRepository.save(app);

        // Format date for email
        String dateStr = "Not specified";
        if (req.getInterviewAt() != null) {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");
            dateStr = sdf.format(req.getInterviewAt());
        }

        emailService.sendInterviewInvitation(
            app.getStudent().getUser().getEmail(),
            app.getStudent().getName(),
            app.getJob().getTitle(),
            app.getJob().getCompany(),
            dateStr,
            req.getLocation(),
            email
        );

        return ResponseEntity.ok(saved);
    }
}
