package xyz.yettensyvus.internshipfinder.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import xyz.yettensyvus.internshipfinder.dto.StudentProfileDTO;
import xyz.yettensyvus.internshipfinder.enums.NotificationType;
import xyz.yettensyvus.internshipfinder.model.Student;
import xyz.yettensyvus.internshipfinder.repository.StudentRepository;
import xyz.yettensyvus.internshipfinder.repository.UserRepository;
import xyz.yettensyvus.internshipfinder.service.FileUploadService;
import xyz.yettensyvus.internshipfinder.service.NotificationService;
import xyz.yettensyvus.internshipfinder.service.StudentService;

import java.io.IOException;

@Service
public class StudentServiceImpl implements StudentService {

    @Autowired
    private StudentRepository studentRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private FileUploadService fileUploadService;

    @Override
    public Student getLoggedInStudent() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return studentRepo.findByUserEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found for email: " + email));
    }

    @Override
    public StudentProfileDTO getProfileForLoggedInUser() {
        Student s = getLoggedInStudent();

        StudentProfileDTO dto = new StudentProfileDTO();
        dto.setName(s.getName());
        dto.setEmail(s.getUser().getEmail());
        dto.setPhone(s.getPhone());
        dto.setCollege(s.getCollege());
        dto.setBranch(s.getBranch());
        dto.setYearOfPassing(s.getYearOfPassing());
        dto.setResumeUrl(fileUploadService.toReadSasUrl(s.getResumeUrl()));
        dto.setProfilePictureUrl(fileUploadService.toReadSasUrl(s.getUser().getProfilePictureUrl()));

        return dto;
    }

    @Override
    public String updateProfileForLoggedInUser(StudentProfileDTO dto) {
        Student s = getLoggedInStudent();

        s.setName(dto.getName());
        s.setPhone(dto.getPhone());
        s.setCollege(dto.getCollege());
        s.setBranch(dto.getBranch());
        s.setYearOfPassing(dto.getYearOfPassing());

        studentRepo.save(s);
        return "Profile updated successfully";
    }

    @Override
    public String uploadResumeForLoggedInUser(MultipartFile file) throws IOException {
        Student student = getLoggedInStudent();

        String previous = student.getResumeUrl();
        if (previous != null && !previous.isBlank()) {
            fileUploadService.deleteFileIfExists(previous);
        }

        String uploadedUrl = fileUploadService.uploadFile(file, "resumes");
        String stableUrl = fileUploadService.toStableBlobUrl(uploadedUrl);

        student.setResumeUrl(stableUrl);
        studentRepo.save(student);

        String email = student.getUser() != null ? student.getUser().getEmail() : null;
        notificationService.createForAdmins(
                NotificationType.RESUME_UPLOADED,
                "Resume uploaded",
                "A student uploaded a resume: " + (email == null ? "" : email),
                email,
                null,
                null
        );

        return fileUploadService.toReadSasUrl(stableUrl);
    }

    @Override
    public String uploadProfilePictureForLoggedInUser(MultipartFile file) throws IOException {
        Student student = getLoggedInStudent();

        String imageUrl = fileUploadService.uploadFile(file, "student-profile-pictures");

        if (student.getUser() != null) {
            student.getUser().setProfilePictureUrl(imageUrl);
            userRepo.save(student.getUser());
        }
        studentRepo.save(student);

        return fileUploadService.toReadSasUrl(imageUrl);
    }
}
