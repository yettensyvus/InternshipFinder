package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.model.Application;
import xyz.yettensyvus.internshipfinder.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/student")
@CrossOrigin
public class StudentApplicationController {

    @Autowired
    private ApplicationService appService;


    @PostMapping("/apply/{jobId}")
    public ResponseEntity<String> applyToJob(@PathVariable Long jobId, Principal principal) {
        String email = principal.getName();
        return ResponseEntity.ok(appService.applyToJobByEmail(email, jobId));
    }

    @PostMapping("/apply/{userId}/{jobId}")
    public ResponseEntity<String> applyToJobCompat(@PathVariable Long userId, @PathVariable Long jobId, Principal principal) {
        String email = principal.getName();
        return ResponseEntity.ok(appService.applyToJobByEmail(email, jobId));
    }

    @GetMapping("/applications")
    public ResponseEntity<List<Application>> getApplications(Principal principal) {
        String email = principal.getName();
        return ResponseEntity.ok(appService.getApplicationsByEmail(email));
    }
}
