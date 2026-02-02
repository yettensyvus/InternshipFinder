package xyz.yettensyvus.internshipfinder.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;
import xyz.yettensyvus.internshipfinder.dto.AdminProfileDTO;
import xyz.yettensyvus.internshipfinder.dto.AdminRecruiterDetailsDTO;
import xyz.yettensyvus.internshipfinder.dto.AdminStudentDetailsDTO;
import xyz.yettensyvus.internshipfinder.dto.AdminUserDetailsDTO;
import xyz.yettensyvus.internshipfinder.dto.AdminUserUpdateRequest;
import xyz.yettensyvus.internshipfinder.enums.Role;
import xyz.yettensyvus.internshipfinder.model.*;
import xyz.yettensyvus.internshipfinder.repository.*;
import xyz.yettensyvus.internshipfinder.service.AdminService;
import xyz.yettensyvus.internshipfinder.service.FileUploadService;

import java.util.*;

@Service
public class AdminServiceImpl implements AdminService {

    @Autowired private StudentRepository studentRepo;
    @Autowired private RecruiterRepository recruiterRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private JobRepository jobRepo;
    @Autowired private ApplicationRepository applicationRepo;
    @Autowired private NotificationRepository notificationRepo;

    @Autowired private FileUploadService fileUploadService;

    @Override
    public List<Student> getAllStudents() {
        return studentRepo.findAll();
    }

    @Override
    public List<Recruiter> getAllRecruiters() {
        return recruiterRepo.findAll();
    }

    @Override
    public void toggleUserBlock(Long id) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(!user.isEnabled());
        userRepo.save(user);
    }

    @Override
    public void setUserEnabled(Long id, boolean enabled) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(enabled);
        userRepo.save(user);
    }

    @Override
    public List<User> getAllUsers() {
        return userRepo.findAll();
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        List<String> blobsToDelete = new ArrayList<>();
        if (user.getProfilePictureUrl() != null && !user.getProfilePictureUrl().isBlank()) {
            blobsToDelete.add(user.getProfilePictureUrl());
        }

        if (user.getRole() == Role.STUDENT) {
            Student student = studentRepo.findByUserId(user.getId());
            if (student != null) {
                if (student.getResumeUrl() != null && !student.getResumeUrl().isBlank()) {
                    blobsToDelete.add(student.getResumeUrl());
                }
                if (student.getProfilePictureUrl() != null && !student.getProfilePictureUrl().isBlank()) {
                    blobsToDelete.add(student.getProfilePictureUrl());
                }
                applicationRepo.deleteByStudent(student);
                studentRepo.delete(student);
            }
        }

        if (user.getRole() == Role.RECRUITER) {
            Recruiter recruiter = recruiterRepo.findByUserId(user.getId());
            if (recruiter != null) {
                if (recruiter.getProfilePictureUrl() != null && !recruiter.getProfilePictureUrl().isBlank()) {
                    blobsToDelete.add(recruiter.getProfilePictureUrl());
                }
                List<Job> jobs = jobRepo.findByRecruiter(recruiter);
                for (Job job : jobs) {
                    applicationRepo.deleteByJob(job);
                }
                jobRepo.deleteAll(jobs);
                recruiterRepo.delete(recruiter);
            }
        }

        notificationRepo.deleteByUser(user);
        userRepo.delete(user);

        if (!blobsToDelete.isEmpty()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    for (String blob : blobsToDelete) {
                        try {
                            fileUploadService.deleteFileIfExists(blob);
                        } catch (Exception ex) {
                            System.err.println("Failed to delete blob: " + blob + " | " + ex.getMessage());
                        }
                    }
                }
            });
        }
    }

    @Override
    public AdminUserDetailsDTO getUserDetails(Long id) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        AdminStudentDetailsDTO studentDto = null;
        AdminRecruiterDetailsDTO recruiterDto = null;

        if (user.getRole() == Role.STUDENT) {
            Student s = studentRepo.findByUserId(user.getId());
            if (s != null) {
                studentDto = new AdminStudentDetailsDTO(
                        s.getId(),
                        s.getName(),
                        s.getPhone(),
                        s.getCollege(),
                        s.getBranch(),
                        s.getYearOfPassing(),
                        fileUploadService.toReadSasUrl(s.getResumeUrl()),
                        fileUploadService.toReadSasUrl(s.getProfilePictureUrl())
                );
            }
        }

        if (user.getRole() == Role.RECRUITER) {
            Recruiter r = recruiterRepo.findByUserId(user.getId());
            if (r != null) {
                recruiterDto = new AdminRecruiterDetailsDTO(
                        r.getId(),
                        r.getCompanyName(),
                        r.getCompanyWebsite(),
                        fileUploadService.toReadSasUrl(r.getProfilePictureUrl())
                );
            }
        }

        return new AdminUserDetailsDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled(),
                studentDto,
                recruiterDto
        );
    }

    @Override
    @Transactional
    public AdminUserDetailsDTO updateUserDetails(Long id, AdminUserUpdateRequest req) {
        return updateUserDetails(id, req, null);
    }

    @Override
    @Transactional
    public AdminUserDetailsDTO updateUserDetails(Long id, AdminUserUpdateRequest req, String requesterEmail) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        List<String> blobsToDelete = new ArrayList<>();

        if (req.getRole() != null && req.getRole() != user.getRole()) {
            if (requesterEmail != null && user.getEmail() != null && user.getEmail().equalsIgnoreCase(requesterEmail)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
            }
            Role targetRole = req.getRole();

            if (user.getRole() == Role.STUDENT) {
                deleteStudentData(user, blobsToDelete);
            }
            if (user.getRole() == Role.RECRUITER) {
                deleteRecruiterData(user, blobsToDelete);
            }

            if (targetRole == Role.STUDENT) {
                ensureStudent(user);
            }
            if (targetRole == Role.RECRUITER) {
                ensureRecruiter(user);
            }

            user.setRole(targetRole);
        }

        if (req.getUsername() != null) {
            user.setUsername(req.getUsername());
        }
        if (req.getEmail() != null && !req.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepo.existsByEmail(req.getEmail())) {
                throw new RuntimeException("Email already registered");
            }
            user.setEmail(req.getEmail());
        }
        if (req.getEnabled() != null) {
            user.setEnabled(req.getEnabled());
        }
        userRepo.save(user);

        if (!blobsToDelete.isEmpty()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
            public void afterCommit() {
                    for (String blob : blobsToDelete) {
                        try {
                            fileUploadService.deleteFileIfExists(blob);
                        } catch (Exception ex) {
                            System.err.println("Failed to delete blob: " + blob + " | " + ex.getMessage());
                        }
                    }
                }
            });
        }

        if (user.getRole() == Role.STUDENT && req.getStudent() != null) {
            Student s = studentRepo.findByUserId(user.getId());
            if (s != null) {
                AdminStudentDetailsDTO dto = req.getStudent();
                if (dto.getName() != null) s.setName(dto.getName());
                if (dto.getPhone() != null) s.setPhone(dto.getPhone());
                if (dto.getCollege() != null) s.setCollege(dto.getCollege());
                if (dto.getBranch() != null) s.setBranch(dto.getBranch());
                if (dto.getYearOfPassing() != null) s.setYearOfPassing(dto.getYearOfPassing());
                if (dto.getResumeUrl() != null) s.setResumeUrl(fileUploadService.toStableBlobUrl(dto.getResumeUrl()));
                if (dto.getProfilePictureUrl() != null) s.setProfilePictureUrl(fileUploadService.toStableBlobUrl(dto.getProfilePictureUrl()));
                studentRepo.save(s);
            }
        }

        if (user.getRole() == Role.RECRUITER && req.getRecruiter() != null) {
            Recruiter r = recruiterRepo.findByUserId(user.getId());
            if (r != null) {
                AdminRecruiterDetailsDTO dto = req.getRecruiter();
                if (dto.getCompanyName() != null) r.setCompanyName(dto.getCompanyName());
                if (dto.getCompanyWebsite() != null) r.setCompanyWebsite(dto.getCompanyWebsite());
                if (dto.getProfilePictureUrl() != null) r.setProfilePictureUrl(fileUploadService.toStableBlobUrl(dto.getProfilePictureUrl()));
                recruiterRepo.save(r);
            }
        }

        return getUserDetails(id);
    }

    private void deleteStudentData(User user, List<String> blobsToDelete) {
        Student student = studentRepo.findByUserId(user.getId());
        if (student == null) return;

        if (student.getResumeUrl() != null && !student.getResumeUrl().isBlank()) {
            blobsToDelete.add(student.getResumeUrl());
        }
        if (student.getProfilePictureUrl() != null && !student.getProfilePictureUrl().isBlank()) {
            blobsToDelete.add(student.getProfilePictureUrl());
        }

        applicationRepo.deleteByStudent(student);
        studentRepo.delete(student);
    }

    private void deleteRecruiterData(User user, List<String> blobsToDelete) {
        Recruiter recruiter = recruiterRepo.findByUserId(user.getId());
        if (recruiter == null) return;

        if (recruiter.getProfilePictureUrl() != null && !recruiter.getProfilePictureUrl().isBlank()) {
            blobsToDelete.add(recruiter.getProfilePictureUrl());
        }

        List<Job> jobs = jobRepo.findByRecruiter(recruiter);
        for (Job job : jobs) {
            applicationRepo.deleteByJob(job);
        }
        jobRepo.deleteAll(jobs);
        recruiterRepo.delete(recruiter);
    }

    private void ensureStudent(User user) {
        Student existing = studentRepo.findByUserId(user.getId());
        if (existing != null) return;
        Student s = new Student();
        s.setUser(user);
        studentRepo.save(s);
    }

    private void ensureRecruiter(User user) {
        Recruiter existing = recruiterRepo.findByUserId(user.getId());
        if (existing != null) return;
        Recruiter r = new Recruiter();
        r.setUser(user);
        recruiterRepo.save(r);
    }

    @Override
    public List<Job> getAllJobs() {
        return jobRepo.findAll();
    }

    @Override
    public void toggleJobStatus(Long jobId) {
        Job job = jobRepo.findById(jobId).orElseThrow(() -> new RuntimeException("Job not found"));
        job.setActive(!job.isActive());
        jobRepo.save(job);
    }

    @Override
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", studentRepo.count());
        stats.put("totalRecruiters", recruiterRepo.count());
        stats.put("totalJobs", jobRepo.count());
        stats.put("totalUsers", userRepo.count());
        stats.put("totalApplications", applicationRepo.count());
        return stats;
    }

    @Override
    public AdminProfileDTO getAdminProfile(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new AdminProfileDTO(
                user.getEmail(),
                user.getUsername(),
                user.getRole().name(),
                fileUploadService.toReadSasUrl(user.getProfilePictureUrl())
        );
    }

    @Override
    public String updateAdminProfile(String email, AdminProfileDTO dto) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.getUsername() != null) {
            user.setUsername(dto.getUsername());
        }

        userRepo.save(user);
        return "Admin profile updated";
    }

    @Override
    public String uploadAdminProfilePicture(String email, org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String imageUrl = fileUploadService.uploadFile(file, "admin-profile-pictures");
        user.setProfilePictureUrl(imageUrl);
        userRepo.save(user);

        return fileUploadService.toReadSasUrl(imageUrl);
    }
}
