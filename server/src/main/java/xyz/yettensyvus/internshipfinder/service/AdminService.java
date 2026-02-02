package xyz.yettensyvus.internshipfinder.service;


import xyz.yettensyvus.internshipfinder.dto.AdminProfileDTO;
import xyz.yettensyvus.internshipfinder.dto.AdminUserDetailsDTO;
import xyz.yettensyvus.internshipfinder.dto.AdminUserUpdateRequest;
import xyz.yettensyvus.internshipfinder.model.Job;
import xyz.yettensyvus.internshipfinder.model.Recruiter;
import xyz.yettensyvus.internshipfinder.model.Student;
import xyz.yettensyvus.internshipfinder.model.User;

import java.util.List;
import java.util.Map;

public interface AdminService {

    List<Student> getAllStudents();

    List<Recruiter> getAllRecruiters();

    void toggleUserBlock(Long id);

    void setUserEnabled(Long id, boolean enabled);

    List<User> getAllUsers();

    void deleteUser(Long id);

    AdminUserDetailsDTO getUserDetails(Long id);

    AdminUserDetailsDTO updateUserDetails(Long id, AdminUserUpdateRequest req);

    AdminUserDetailsDTO updateUserDetails(Long id, AdminUserUpdateRequest req, String requesterEmail);

    List<Job> getAllJobs();

    void toggleJobStatus(Long jobId);

    Map<String, Object> getDashboardStats();

    AdminProfileDTO getAdminProfile(String email);

    String updateAdminProfile(String email, AdminProfileDTO dto);

    String uploadAdminProfilePicture(String email, org.springframework.web.multipart.MultipartFile file) throws java.io.IOException;
}
