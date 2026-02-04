package xyz.yettensyvus.internshipfinder.config;

import xyz.yettensyvus.internshipfinder.enums.NotificationType;
import xyz.yettensyvus.internshipfinder.enums.Role;
import xyz.yettensyvus.internshipfinder.enums.Status;
import xyz.yettensyvus.internshipfinder.model.Application;
import xyz.yettensyvus.internshipfinder.model.Job;
import xyz.yettensyvus.internshipfinder.model.Notification;
import xyz.yettensyvus.internshipfinder.model.Recruiter;
import xyz.yettensyvus.internshipfinder.model.Student;
import xyz.yettensyvus.internshipfinder.model.User;
import xyz.yettensyvus.internshipfinder.repository.ApplicationRepository;
import xyz.yettensyvus.internshipfinder.repository.JobRepository;
import xyz.yettensyvus.internshipfinder.repository.NotificationRepository;
import xyz.yettensyvus.internshipfinder.repository.RecruiterRepository;
import xyz.yettensyvus.internshipfinder.repository.StudentRepository;
import xyz.yettensyvus.internshipfinder.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RecruiterRepository recruiterRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        User admin = ensureUser("Admin", "admin@example.com", "admin@example.com", Role.ADMIN, true);

        User recruiter1User = ensureUser("Recruiter One", "recruiter1@example.com", "recruiter1@example.com", Role.RECRUITER, true);
        User recruiter2User = ensureUser("Recruiter Two", "recruiter2@example.com", "recruiter2@example.com", Role.RECRUITER, true);

        Recruiter recruiter1 = ensureRecruiter(recruiter1User, "TechNova", "https://technova.example", "");
        Recruiter recruiter2 = ensureRecruiter(recruiter2User, "CloudWorks", "https://cloudworks.example", "");

        User student1User = ensureUser("Alice Student", "student1@example.com", "student1@example.com", Role.STUDENT, true);
        User student2User = ensureUser("Bob Student", "student2@example.com", "student2@example.com", Role.STUDENT, true);
        User student3User = ensureUser("Charlie Student", "student3@example.com", "student3@example.com", Role.STUDENT, false);

        Student student1 = ensureStudent(student1User, "Alice", "+1 555 100 100", "USM", "CSE", "2026", "", "");
        Student student2 = ensureStudent(student2User, "Bob", "+1 555 200 200", "USM", "IT", "2025", "", "");
        ensureStudent(student3User, "Charlie", "+1 555 300 300", "USM", "ECE", "2027", "", "");

        Job job1 = ensureJob(recruiter1, "Frontend Intern", "TechNova", "Remote", "INTERNSHIP",
                "Work with React and TailwindCSS to build modern UI components.", "2026-12-31");
        Job job2 = ensureJob(recruiter1, "Backend Intern", "TechNova", "On-site", "INTERNSHIP",
                "Assist with Spring Boot APIs, database design, and testing.", "2026-11-30");
        Job job3 = ensureJob(recruiter2, "Junior Java Developer", "CloudWorks", "Hybrid", "JOB",
                "Build and maintain microservices with Spring Boot.", "2026-10-15");

        Application app1 = ensureApplication(student1, job1, Status.APPLIED);
        Application app2 = ensureApplication(student2, job2, Status.SHORTLISTED);

        ensureNotification(admin, "New user registered", "student1@example.com registered as STUDENT", NotificationType.USER_REGISTERED, "student1@example.com", null, null);
        ensureNotification(admin, "Job posted", "TechNova posted a new internship: Frontend Intern", NotificationType.JOB_POSTED, "recruiter1@example.com", job1.getId(), null);

        ensureNotification(recruiter1User, "Application received", "Alice applied to Frontend Intern", NotificationType.APPLICATION_SUBMITTED, "student1@example.com", job1.getId(), app1.getId());
        ensureNotification(recruiter1User, "Application updated", "Bob was shortlisted for Backend Intern", NotificationType.APPLICATION_STATUS_CHANGED, "recruiter1@example.com", job2.getId(), app2.getId());

        ensureNotification(student1User, "Application submitted", "You applied to Frontend Intern at TechNova", NotificationType.APPLICATION_SUBMITTED, "student1@example.com", job1.getId(), app1.getId());
        ensureNotification(student2User, "Application status changed", "Your application for Backend Intern is now SHORTLISTED", NotificationType.APPLICATION_STATUS_CHANGED, "recruiter1@example.com", job2.getId(), app2.getId());

        System.out.println("Seed data ready (idempotent). Admin login: admin@example.com / admin@example.com");
    }

    private User ensureUser(String username, String email, String rawPassword, Role role, boolean enabled) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User u = existing.get();
            boolean changed = false;
            if (u.getRole() != role) {
                u.setRole(role);
                changed = true;
            }
            if (u.isEnabled() != enabled) {
                u.setEnabled(enabled);
                changed = true;
            }
            if (u.getUsername() == null || u.getUsername().isBlank()) {
                u.setUsername(username);
                changed = true;
            }
            if (changed) {
                return userRepository.save(u);
            }
            return u;
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setEnabled(enabled);
        User saved = userRepository.save(user);
        System.out.println("User created: " + email);
        return saved;
    }

    private Student ensureStudent(User user, String name, String phone, String college, String branch, String yearOfPassing, String resumeUrl, String profilePictureUrl) {
        Optional<Student> existing = studentRepository.findByUserEmail(user.getEmail());
        if (existing.isPresent()) {
            Student s = existing.get();
            boolean changed = false;
            if (s.getName() == null || s.getName().isBlank()) {
                s.setName(name);
                changed = true;
            }
            if (s.getPhone() == null || s.getPhone().isBlank()) {
                s.setPhone(phone);
                changed = true;
            }
            if (s.getCollege() == null || s.getCollege().isBlank()) {
                s.setCollege(college);
                changed = true;
            }
            if (s.getBranch() == null || s.getBranch().isBlank()) {
                s.setBranch(branch);
                changed = true;
            }
            if (s.getYearOfPassing() == null || s.getYearOfPassing().isBlank()) {
                s.setYearOfPassing(yearOfPassing);
                changed = true;
            }
            if ((s.getResumeUrl() == null || s.getResumeUrl().isBlank()) && resumeUrl != null) {
                s.setResumeUrl(resumeUrl);
                changed = true;
            }
            if ((user.getProfilePictureUrl() == null || user.getProfilePictureUrl().isBlank()) && profilePictureUrl != null) {
                user.setProfilePictureUrl(profilePictureUrl);
                userRepository.save(user);
            }
            if (changed) {
                return studentRepository.save(s);
            }
            return s;
        }

        Student student = new Student();
        student.setUser(user);
        student.setName(name);
        student.setPhone(phone);
        student.setCollege(college);
        student.setBranch(branch);
        student.setYearOfPassing(yearOfPassing);
        student.setResumeUrl(resumeUrl);
        if (profilePictureUrl != null && !profilePictureUrl.isBlank()) {
            user.setProfilePictureUrl(profilePictureUrl);
            userRepository.save(user);
        }
        Student saved = studentRepository.save(student);
        System.out.println("Student profile created for: " + user.getEmail());
        return saved;
    }

    private Recruiter ensureRecruiter(User user, String companyName, String companyWebsite, String profilePictureUrl) {
        Recruiter existing = recruiterRepository.findByUserEmail(user.getEmail());
        if (existing != null) {
            boolean changed = false;
            if (existing.getCompanyName() == null || existing.getCompanyName().isBlank()) {
                existing.setCompanyName(companyName);
                changed = true;
            }
            if (existing.getCompanyWebsite() == null || existing.getCompanyWebsite().isBlank()) {
                existing.setCompanyWebsite(companyWebsite);
                changed = true;
            }
            if ((user.getProfilePictureUrl() == null || user.getProfilePictureUrl().isBlank()) && profilePictureUrl != null) {
                user.setProfilePictureUrl(profilePictureUrl);
                userRepository.save(user);
            }
            if (changed) {
                return recruiterRepository.save(existing);
            }
            return existing;
        }

        Recruiter recruiter = new Recruiter();
        recruiter.setUser(user);
        recruiter.setCompanyName(companyName);
        recruiter.setCompanyWebsite(companyWebsite);
        if (profilePictureUrl != null && !profilePictureUrl.isBlank()) {
            user.setProfilePictureUrl(profilePictureUrl);
            userRepository.save(user);
        }
        Recruiter saved = recruiterRepository.save(recruiter);
        System.out.println("Recruiter profile created for: " + user.getEmail());
        return saved;
    }

    private Job ensureJob(Recruiter recruiter, String title, String company, String location, String type, String description, String deadline) {
        List<Job> existing = jobRepository.findByRecruiter(recruiter);
        for (Job j : existing) {
            if (j.getTitle() != null && j.getCompany() != null
                    && j.getTitle().equalsIgnoreCase(title)
                    && j.getCompany().equalsIgnoreCase(company)) {
                return j;
            }
        }

        Job job = new Job();
        job.setRecruiter(recruiter);
        job.setTitle(title);
        job.setCompany(company);
        job.setLocation(location);
        job.setType(type);
        job.setDescription(description);
        job.setDeadline(deadline);
        job.setPaid("INTERNSHIP".equalsIgnoreCase(type));
        job.setDuration("INTERNSHIP".equalsIgnoreCase(type) ? "3 months" : null);
        job.setCompensation("INTERNSHIP".equalsIgnoreCase(type) ? "Unpaid" : null);
        job.setActive(true);
        Job saved = jobRepository.save(job);
        System.out.println("Job created: " + title + " @ " + company);
        return saved;
    }

    private Application ensureApplication(Student student, Job job, Status status) {
        if (applicationRepository.existsByStudentAndJob(student, job)) {
            List<Application> list = applicationRepository.findByStudent(student);
            for (Application a : list) {
                if (a.getJob() != null && a.getJob().getId() != null && a.getJob().getId().equals(job.getId())) {
                    if (a.getStatus() != status) {
                        a.setStatus(status);
                        return applicationRepository.save(a);
                    }
                    return a;
                }
            }
        }

        Application app = new Application();
        app.setStudent(student);
        app.setJob(job);
        app.setStatus(status);
        app.setAppliedAt(new Date());
        Application saved = applicationRepository.save(app);
        System.out.println("Application created: " + student.getUser().getEmail() + " -> " + job.getTitle());
        return saved;
    }

    private void ensureNotification(User user, String title, String message, NotificationType type, String actorEmail, Long jobId, Long applicationId) {
        List<Notification> existing = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        for (Notification n : existing) {
            if (safeEqualsIgnoreCase(n.getTitle(), title)
                    && n.getType() == type
                    && safeEquals(n.getActorEmail(), actorEmail)
                    && safeEquals(n.getJobId(), jobId)
                    && safeEquals(n.getApplicationId(), applicationId)) {
                return;
            }
        }

        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setActorEmail(actorEmail);
        n.setJobId(jobId);
        n.setApplicationId(applicationId);
        n.setRead(false);
        notificationRepository.save(n);
    }

    private boolean safeEquals(Object a, Object b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }

    private boolean safeEqualsIgnoreCase(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equalsIgnoreCase(b);
    }
}
