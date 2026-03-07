package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.dto.AdminProfileDTO;
import xyz.yettensyvus.internshipfinder.dto.AdminUserDetailsDTO;
import xyz.yettensyvus.internshipfinder.dto.AdminUserUpdateRequest;
import xyz.yettensyvus.internshipfinder.model.*;
import xyz.yettensyvus.internshipfinder.service.AdminService;
import xyz.yettensyvus.internshipfinder.service.SystemLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;

import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;
import java.security.Principal;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private SystemLogService logService;

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "Unknown";
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0];
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }

    @GetMapping("/logs")
    public ResponseEntity<List<SystemLog>> getRecentLogs() {
        return ResponseEntity.ok(logService.getRecentLogs());
    }

    @GetMapping("/students")
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(adminService.getAllStudents());
    }

    @GetMapping("/recruiters")
    public ResponseEntity<List<Recruiter>> getAllRecruiters() {
        return ResponseEntity.ok(adminService.getAllRecruiters());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserDetailsDTO> getUserDetails(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserDetails(id));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<AdminUserDetailsDTO> updateUserDetails(@PathVariable Long id, @Valid @RequestBody AdminUserUpdateRequest req, Principal principal, HttpServletRequest httpRequest) {
        AdminUserDetailsDTO updated = adminService.updateUserDetails(id, req, principal.getName());
        logService.log(
                "ADMIN_UPDATE_USER",
                "Updated userId=" + id,
                principal != null ? principal.getName() : "Anonymous",
                getClientIp(httpRequest),
                SystemLog.LogLevel.INFO
        );
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/user/{id}/block")
    public ResponseEntity<String> toggleUserBlock(@PathVariable Long id, Principal principal, HttpServletRequest httpRequest) {
        adminService.toggleUserBlock(id);
        logService.log(
                "ADMIN_TOGGLE_USER_BLOCK",
                "Toggled block status for userId=" + id,
                principal != null ? principal.getName() : "Anonymous",
                getClientIp(httpRequest),
                SystemLog.LogLevel.WARN
        );
        return ResponseEntity.ok("User block status updated");
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<String> setUserEnabled(@PathVariable Long id, @RequestParam boolean enabled, Principal principal, HttpServletRequest httpRequest) {
        adminService.setUserEnabled(id, enabled);
        logService.log(
                "ADMIN_SET_USER_ENABLED",
                "Set enabled=" + enabled + " for userId=" + id,
                principal != null ? principal.getName() : "Anonymous",
                getClientIp(httpRequest),
                SystemLog.LogLevel.WARN
        );
        return ResponseEntity.ok("User status updated");
    }

    @DeleteMapping("/user/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id, Principal principal, HttpServletRequest httpRequest) {
        adminService.deleteUser(id);
        logService.log(
                "ADMIN_DELETE_USER",
                "Deleted userId=" + id,
                principal != null ? principal.getName() : "Anonymous",
                getClientIp(httpRequest),
                SystemLog.LogLevel.ERROR
        );
        return ResponseEntity.ok("User deleted successfully");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUserCompat(@PathVariable Long id, Principal principal, HttpServletRequest httpRequest) {
        adminService.deleteUser(id);
        logService.log(
                "ADMIN_DELETE_USER",
                "Deleted userId=" + id,
                principal != null ? principal.getName() : "Anonymous",
                getClientIp(httpRequest),
                SystemLog.LogLevel.ERROR
        );
        return ResponseEntity.ok("User deleted successfully");
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<Job>> getAllJobs() {
        return ResponseEntity.ok(adminService.getAllJobs());
    }

    @PutMapping("/job/{id}/toggle")
    public ResponseEntity<String> toggleJobStatus(@PathVariable Long id, Principal principal, HttpServletRequest httpRequest) {
        adminService.toggleJobStatus(id);
        logService.log(
                "ADMIN_TOGGLE_JOB_STATUS",
                "Toggled job status for jobId=" + id,
                principal != null ? principal.getName() : "Anonymous",
                getClientIp(httpRequest),
                SystemLog.LogLevel.WARN
        );
        return ResponseEntity.ok("Job status updated");
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStatsCompat() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/profile")
    public ResponseEntity<AdminProfileDTO> getProfile(Principal principal) {
        return ResponseEntity.ok(adminService.getAdminProfile(principal.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<String> updateProfile(@RequestBody AdminProfileDTO dto, Principal principal, HttpServletRequest httpRequest) {
        String result = adminService.updateAdminProfile(principal.getName(), dto);
        logService.log(
                "ADMIN_UPDATE_PROFILE",
                "Updated admin profile",
                principal != null ? principal.getName() : "Anonymous",
                getClientIp(httpRequest),
                SystemLog.LogLevel.INFO
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping("/profile-picture")
    public ResponseEntity<String> uploadProfilePicture(@RequestParam("file") MultipartFile file, Principal principal, HttpServletRequest httpRequest) throws Exception {
        String url = adminService.uploadAdminProfilePicture(principal.getName(), file);
        logService.log(
                "ADMIN_UPLOAD_PROFILE_PICTURE",
                "Uploaded profile picture" + (file != null ? " | filename=" + file.getOriginalFilename() + " | size=" + file.getSize() : ""),
                principal != null ? principal.getName() : "Anonymous",
                getClientIp(httpRequest),
                SystemLog.LogLevel.WARN
        );
        return ResponseEntity.ok(url);
    }

    @PostMapping("/users/{id}/profile-picture")
    public ResponseEntity<String> uploadUserProfilePicture(@PathVariable Long id, @RequestParam("file") MultipartFile file, Principal principal, HttpServletRequest httpRequest) throws Exception {
        String url = adminService.uploadUserProfilePicture(id, file);
        logService.log(
                "ADMIN_UPLOAD_USER_PROFILE_PICTURE",
                "Uploaded user profile picture for userId=" + id + (file != null ? " | filename=" + file.getOriginalFilename() + " | size=" + file.getSize() : ""),
                principal != null ? principal.getName() : "Anonymous",
                getClientIp(httpRequest),
                SystemLog.LogLevel.WARN
        );
        return ResponseEntity.ok(url);
    }

    @PostMapping("/users/{id}/resume")
    public ResponseEntity<String> uploadUserResume(@PathVariable Long id, @RequestParam("file") MultipartFile file, Principal principal, HttpServletRequest httpRequest) throws Exception {
        String url = adminService.uploadUserResume(id, file);
        logService.log(
                "ADMIN_UPLOAD_USER_RESUME",
                "Uploaded user resume for userId=" + id + (file != null ? " | filename=" + file.getOriginalFilename() + " | size=" + file.getSize() : ""),
                principal != null ? principal.getName() : "Anonymous",
                getClientIp(httpRequest),
                SystemLog.LogLevel.WARN
        );
        return ResponseEntity.ok(url);
    }

    @PostMapping("/users/{id}/force-logout")
    public ResponseEntity<String> forceLogout(@PathVariable Long id, Principal principal, HttpServletRequest httpRequest) {
        adminService.forceLogout(id);
        logService.log(
                "ADMIN_FORCE_LOGOUT",
                "Force logout for userId=" + id,
                principal != null ? principal.getName() : "Anonymous",
                getClientIp(httpRequest),
                SystemLog.LogLevel.WARN
        );
        return ResponseEntity.ok("User logged out from all devices");
    }
}
