package xyz.yettensyvus.internshipfinder.service;

import xyz.yettensyvus.internshipfinder.dto.RecruiterProfileDTO;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface RecruiterService {

    RecruiterProfileDTO getProfile(String email);

    String updateProfile(String email, RecruiterProfileDTO dto);

    String uploadProfilePicture(String email, MultipartFile file) throws IOException;
}
