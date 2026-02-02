package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.dto.RecruiterProfileDTO;
import xyz.yettensyvus.internshipfinder.service.RecruiterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;

import java.security.Principal;

@RestController
@RequestMapping("/api/recruiter")
@CrossOrigin
public class RecruiterProfileController {

    @Autowired
    private RecruiterService recruiterService;

    @GetMapping("/profile")
    public ResponseEntity<RecruiterProfileDTO> getProfile(Principal principal) {
        return ResponseEntity.ok(recruiterService.getProfile(principal.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<String> updateProfile(@Valid @RequestBody RecruiterProfileDTO dto, Principal principal) {
        return ResponseEntity.ok(recruiterService.updateProfile(principal.getName(), dto));
    }

    @PostMapping("/profile-picture")
    public ResponseEntity<String> uploadProfilePicture(@RequestParam("file") MultipartFile file, Principal principal) throws Exception {
        return ResponseEntity.ok(recruiterService.uploadProfilePicture(principal.getName(), file));
    }
}
