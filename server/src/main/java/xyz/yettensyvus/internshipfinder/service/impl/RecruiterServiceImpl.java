package xyz.yettensyvus.internshipfinder.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import xyz.yettensyvus.internshipfinder.dto.RecruiterProfileDTO;
import xyz.yettensyvus.internshipfinder.model.Recruiter;
import xyz.yettensyvus.internshipfinder.repository.RecruiterRepository;
import xyz.yettensyvus.internshipfinder.repository.UserRepository;
import xyz.yettensyvus.internshipfinder.service.FileUploadService;
import xyz.yettensyvus.internshipfinder.service.RecruiterService;

import java.io.IOException;

@Service
public class RecruiterServiceImpl implements RecruiterService {

    @Autowired
    private RecruiterRepository recruiterRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private FileUploadService fileUploadService;

    @Override
    public RecruiterProfileDTO getProfile(String email) {
        Recruiter recruiter = recruiterRepo.findByUserEmail(email);

        RecruiterProfileDTO dto = new RecruiterProfileDTO();
        dto.setEmail(recruiter.getUser().getEmail());
        dto.setCompanyName(recruiter.getCompanyName());
        dto.setCompanyWebsite(recruiter.getCompanyWebsite());
        dto.setProfilePictureUrl(fileUploadService.toReadSasUrl(recruiter.getUser().getProfilePictureUrl()));
        return dto;
    }

    @Override
    public String updateProfile(String email, RecruiterProfileDTO dto) {
        Recruiter recruiter = recruiterRepo.findByUserEmail(email);
        recruiter.setCompanyName(dto.getCompanyName());
        recruiter.setCompanyWebsite(dto.getCompanyWebsite());
        recruiterRepo.save(recruiter);
        return "Recruiter profile updated";
    }

    @Override
    public String uploadProfilePicture(String email, MultipartFile file) throws IOException {
        Recruiter recruiter = recruiterRepo.findByUserEmail(email);
        String imageUrl = fileUploadService.uploadFile(file, "recruiter-profile-pictures");
        if (recruiter.getUser() != null) {
            recruiter.getUser().setProfilePictureUrl(imageUrl);
            userRepo.save(recruiter.getUser());
        }
        recruiterRepo.save(recruiter);
        return fileUploadService.toReadSasUrl(imageUrl);
    }
}
