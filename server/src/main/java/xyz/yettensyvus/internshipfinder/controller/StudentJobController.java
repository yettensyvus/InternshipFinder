package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.model.Job;
import xyz.yettensyvus.internshipfinder.repository.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student")
@CrossOrigin
public class StudentJobController {

    @Autowired
    private JobRepository jobRepository;

    @GetMapping("/jobs")
    public ResponseEntity<List<Job>> getAllActiveJobs(@RequestParam(required = false) Boolean paid) {
        if (paid == null) {
            return ResponseEntity.ok(jobRepository.findByIsActiveTrue());
        }
        return ResponseEntity.ok(jobRepository.findByIsActiveTrueAndPaid(paid));
    }
}
