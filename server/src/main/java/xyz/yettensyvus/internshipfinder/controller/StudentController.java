package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.dto.StudentProfileDTO;
import xyz.yettensyvus.internshipfinder.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/student")
@CrossOrigin
public class StudentController {

    @Autowired
    private StudentService studentService;

    @GetMapping("/dashboard")
    public ResponseEntity<String> dashboard() {
        return ResponseEntity.ok("Student dashboard");
    }

    @GetMapping("/profile")
    public ResponseEntity<StudentProfileDTO> getLoggedInStudentProfile() {
        return ResponseEntity.ok(studentService.getProfileForLoggedInUser());
    }

    @PutMapping("/profile")
    public ResponseEntity<String> updateProfile(@Valid @RequestBody StudentProfileDTO dto) {
        return ResponseEntity.ok(studentService.updateProfileForLoggedInUser(dto));
    }

    @PostMapping("/resume")
    public ResponseEntity<String> uploadResume(@RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(studentService.uploadResumeForLoggedInUser(file));
    }

    @PostMapping("/resume/{userId}")
    public ResponseEntity<String> uploadResumeCompat(@PathVariable Long userId, @RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(studentService.uploadResumeForLoggedInUser(file));
    }

    @PostMapping("/profile-picture")
    public ResponseEntity<String> uploadProfilePicture(@RequestParam("file") MultipartFile file) throws Exception {
        return ResponseEntity.ok(studentService.uploadProfilePictureForLoggedInUser(file));
    }
}
