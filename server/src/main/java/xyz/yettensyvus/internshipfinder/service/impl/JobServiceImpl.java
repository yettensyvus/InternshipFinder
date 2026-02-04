package xyz.yettensyvus.internshipfinder.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import xyz.yettensyvus.internshipfinder.dto.JobDetailsResponse;
import xyz.yettensyvus.internshipfinder.dto.RecruiterJobUpdateRequest;
import xyz.yettensyvus.internshipfinder.enums.NotificationType;
import xyz.yettensyvus.internshipfinder.model.Job;
import xyz.yettensyvus.internshipfinder.model.Recruiter;
import xyz.yettensyvus.internshipfinder.repository.JobRepository;
import xyz.yettensyvus.internshipfinder.repository.RecruiterRepository;
import xyz.yettensyvus.internshipfinder.service.FileUploadService;
import xyz.yettensyvus.internshipfinder.service.JobService;
import xyz.yettensyvus.internshipfinder.service.NotificationService;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class JobServiceImpl implements JobService {

    @Autowired
    private JobRepository jobRepo;

    @Autowired
    private RecruiterRepository recruiterRepo;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private FileUploadService fileUploadService;

    private JobDetailsResponse toJobDetails(Job job) {
        String recruiterCompany = null;
        String recruiterEmail = null;
        String recruiterProfilePictureUrl = null;
        if (job.getRecruiter() != null) {
            recruiterCompany = job.getRecruiter().getCompanyName();
            if (job.getRecruiter().getUser() != null) {
                recruiterEmail = job.getRecruiter().getUser().getEmail();
                recruiterProfilePictureUrl = job.getRecruiter().getUser().getProfilePictureUrl();
            }
        }

        String recruiterProfilePictureSas = fileUploadService.toReadSasUrl(recruiterProfilePictureUrl);

        return new JobDetailsResponse(
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
                recruiterProfilePictureSas
        );
    }

    @Override
    public Job postJob(Job job, String email) {
        Recruiter recruiter = recruiterRepo.findByUserEmail(email);
        if (recruiter == null) throw new RuntimeException("Recruiter not found");

        job.setRecruiter(recruiter);
        job.setActive(true);

        if (job.getType() != null && job.getType().equalsIgnoreCase("JOB")) {
            job.setPaid(true);
        }

        Job saved = jobRepo.save(job);

        String company = recruiter.getCompanyName() == null ? "" : recruiter.getCompanyName();
        notificationService.createForAdmins(
                NotificationType.JOB_POSTED,
                "Job posted",
                "A recruiter posted a job: " + saved.getTitle() + (company.isBlank() ? "" : (" (" + company + ")")),
                email,
                saved.getId(),
                null
        );

        return saved;
    }

    @Override
    public List<JobDetailsResponse> getJobsByRecruiterAsDetails(String email) {
        return getJobsByRecruiter(email).stream().map(this::toJobDetails).collect(Collectors.toList());
    }

    @Override
    public JobDetailsResponse getRecruiterJobDetails(String recruiterEmail, Long jobId) {
        Recruiter recruiter = recruiterRepo.findByUserEmail(recruiterEmail);
        if (recruiter == null) throw new RuntimeException("Recruiter not found");

        Job job = jobRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        if (job.getRecruiter() == null || job.getRecruiter().getId() == null
                || !job.getRecruiter().getId().equals(recruiter.getId())) {
            throw new RuntimeException("Not allowed");
        }

        return toJobDetails(job);
    }

    @Override
    public JobDetailsResponse updateRecruiterJob(String recruiterEmail, Long jobId, RecruiterJobUpdateRequest req) {
        Recruiter recruiter = recruiterRepo.findByUserEmail(recruiterEmail);
        if (recruiter == null) throw new RuntimeException("Recruiter not found");

        Job job = jobRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        if (job.getRecruiter() == null || job.getRecruiter().getId() == null
                || !job.getRecruiter().getId().equals(recruiter.getId())) {
            throw new RuntimeException("Not allowed");
        }

        if (req.getTitle() != null) job.setTitle(req.getTitle());
        if (req.getCompany() != null) job.setCompany(req.getCompany());
        if (req.getLocation() != null) job.setLocation(req.getLocation());
        if (req.getDescription() != null) job.setDescription(req.getDescription());
        if (req.getDeadline() != null) job.setDeadline(req.getDeadline());
        if (req.getType() != null) job.setType(req.getType());
        if (req.getPaid() != null) job.setPaid(req.getPaid());
        if (req.getDuration() != null) {
            String duration = req.getDuration();
            job.setDuration(duration != null && duration.isBlank() ? null : duration);
        }
        if (req.getCompensation() != null) {
            String compensation = req.getCompensation();
            job.setCompensation(compensation != null && compensation.isBlank() ? null : compensation);
        }

        if (job.getType() != null && job.getType().equalsIgnoreCase("JOB")) {
            job.setPaid(true);
        }

        if (!job.isPaid()) {
            job.setCompensation(null);
        }
        if (req.getActive() != null) job.setActive(req.getActive());

        Job saved = jobRepo.save(job);
        return toJobDetails(saved);
    }

    @Override
    public List<Job> getJobsByRecruiter(String email) {
        Recruiter recruiter = recruiterRepo.findByUserEmail(email);
        if (recruiter == null) throw new RuntimeException("Recruiter not found");

        return jobRepo.findByRecruiter(recruiter);
    }
}
