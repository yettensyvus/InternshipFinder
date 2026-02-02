package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.dto.AdminProfileDTO;
import xyz.yettensyvus.internshipfinder.dto.AdminUserDetailsDTO;
import xyz.yettensyvus.internshipfinder.dto.AdminUserUpdateRequest;
import xyz.yettensyvus.internshipfinder.model.Job;
import xyz.yettensyvus.internshipfinder.model.Recruiter;
import xyz.yettensyvus.internshipfinder.model.Student;
import xyz.yettensyvus.internshipfinder.model.User;
import xyz.yettensyvus.internshipfinder.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.security.Principal;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminController {

    @Autowired
    private AdminService adminService;

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
    public ResponseEntity<AdminUserDetailsDTO> updateUserDetails(@PathVariable Long id, @Valid @RequestBody AdminUserUpdateRequest req, Principal principal) {
        return ResponseEntity.ok(adminService.updateUserDetails(id, req, principal.getName()));
    }

    @PutMapping("/user/{id}/block")
    public ResponseEntity<String> toggleUserBlock(@PathVariable Long id) {
        adminService.toggleUserBlock(id);
        return ResponseEntity.ok("User block status updated");
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<String> setUserEnabled(@PathVariable Long id, @RequestParam boolean enabled) {
        adminService.setUserEnabled(id, enabled);
        return ResponseEntity.ok("User status updated");
    }

    @DeleteMapping("/user/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUserCompat(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<Job>> getAllJobs() {
        return ResponseEntity.ok(adminService.getAllJobs());
    }

    @PutMapping("/job/{id}/toggle")
    public ResponseEntity<String> toggleJobStatus(@PathVariable Long id) {
        adminService.toggleJobStatus(id);
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
    public ResponseEntity<String> updateProfile(@RequestBody AdminProfileDTO dto, Principal principal) {
        return ResponseEntity.ok(adminService.updateAdminProfile(principal.getName(), dto));
    }

    @PostMapping("/profile-picture")
    public ResponseEntity<String> uploadProfilePicture(@RequestParam("file") MultipartFile file, Principal principal) throws Exception {
        return ResponseEntity.ok(adminService.uploadAdminProfilePicture(principal.getName(), file));
    }
}
