package xyz.yettensyvus.internshipfinder.service;

import xyz.yettensyvus.internshipfinder.dto.StudentProfileDTO;
import xyz.yettensyvus.internshipfinder.model.Student;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface StudentService {

    Student getLoggedInStudent();

    StudentProfileDTO getProfileForLoggedInUser();

    String updateProfileForLoggedInUser(StudentProfileDTO dto);

    String uploadResumeForLoggedInUser(MultipartFile file) throws IOException;

    String uploadProfilePictureForLoggedInUser(MultipartFile file) throws IOException;
}
