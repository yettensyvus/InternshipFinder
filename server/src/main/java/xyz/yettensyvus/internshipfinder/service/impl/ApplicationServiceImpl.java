package xyz.yettensyvus.internshipfinder.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import xyz.yettensyvus.internshipfinder.enums.NotificationType;
import xyz.yettensyvus.internshipfinder.enums.Status;
import xyz.yettensyvus.internshipfinder.model.*;
import xyz.yettensyvus.internshipfinder.repository.ApplicationRepository;
import xyz.yettensyvus.internshipfinder.repository.JobRepository;
import xyz.yettensyvus.internshipfinder.repository.RecruiterRepository;
import xyz.yettensyvus.internshipfinder.repository.StudentRepository;
import xyz.yettensyvus.internshipfinder.repository.UserRepository;
import xyz.yettensyvus.internshipfinder.service.ApplicationService;
import xyz.yettensyvus.internshipfinder.service.NotificationService;

import java.util.Date;
import java.util.List;

@Service
public class ApplicationServiceImpl implements ApplicationService {

    @Autowired
    private ApplicationRepository appRepo;

    @Autowired
    private StudentRepository studentRepo;

    @Autowired
    private JobRepository jobRepo;

    @Autowired
    private RecruiterRepository recruiterRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private NotificationService notificationService;

    @Override
    public String applyToJobByEmail(String email, Long jobId) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Student student = studentRepo.findByUserId(user.getId());
        Job job = jobRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        if (appRepo.existsByStudentAndJob(student, job)) {
            return "Already applied to this job";
        }

        Application app = new Application();
        app.setStudent(student);
        app.setJob(job);
        app.setStatus(Status.APPLIED);
        app.setAppliedAt(new Date());

        appRepo.save(app);

        if (job.getRecruiter() != null && job.getRecruiter().getUser() != null) {
            String studentName = student.getName() == null ? "Student" : student.getName();
            notificationService.createForUserEntity(
                    job.getRecruiter().getUser(),
                    NotificationType.APPLICATION_SUBMITTED,
                    "New application received",
                    studentName + " applied to: " + job.getTitle(),
                    email,
                    job.getId(),
                    app.getId()
            );
        }

        return "Application submitted";
    }

    @Override
    public List<Application> getApplicationsByEmail(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Student student = studentRepo.findByUserId(user.getId());
        return appRepo.findByStudent(student);
    }

    @Override
    public List<Application> getApplicationsByJobForRecruiter(String recruiterEmail, Long jobId) {
        Recruiter recruiter = recruiterRepo.findByUserEmail(recruiterEmail);
        if (recruiter == null) throw new RuntimeException("Recruiter not found");

        Job job = jobRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        if (job.getRecruiter() == null || job.getRecruiter().getId() == null
                || !job.getRecruiter().getId().equals(recruiter.getId())) {
            throw new RuntimeException("Not allowed to view applications for this job");
        }

        return appRepo.findByJob(job);
    }

    @Override
    public Application updateApplicationStatusForRecruiter(String recruiterEmail, Long applicationId, Status status) {
        Recruiter recruiter = recruiterRepo.findByUserEmail(recruiterEmail);
        if (recruiter == null) throw new RuntimeException("Recruiter not found");

        Application application = appRepo.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        Job job = application.getJob();
        if (job == null || job.getRecruiter() == null || job.getRecruiter().getId() == null
                || !job.getRecruiter().getId().equals(recruiter.getId())) {
            throw new RuntimeException("Not allowed to update this application");
        }

        application.setStatus(status);
        Application saved = appRepo.save(application);

        if (saved.getStudent() != null && saved.getStudent().getUser() != null) {
            String jobTitle = job != null && job.getTitle() != null ? job.getTitle() : "your job";
            notificationService.createForUserEntity(
                    saved.getStudent().getUser(),
                    NotificationType.APPLICATION_STATUS_CHANGED,
                    "Application status updated",
                    "Your application for " + jobTitle + " is now: " + status.name(),
                    recruiterEmail,
                    job != null ? job.getId() : null,
                    saved.getId()
            );
        }

        return saved;
    }
}
