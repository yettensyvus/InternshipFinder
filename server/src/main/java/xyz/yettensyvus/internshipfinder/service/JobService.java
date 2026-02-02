package xyz.yettensyvus.internshipfinder.service;

import xyz.yettensyvus.internshipfinder.dto.JobDetailsResponse;
import xyz.yettensyvus.internshipfinder.dto.RecruiterJobUpdateRequest;

import java.util.List;

import xyz.yettensyvus.internshipfinder.model.Job;

public interface JobService {

    Job postJob(Job job, String email);

    List<JobDetailsResponse> getJobsByRecruiterAsDetails(String email);

    JobDetailsResponse getRecruiterJobDetails(String recruiterEmail, Long jobId);

    JobDetailsResponse updateRecruiterJob(String recruiterEmail, Long jobId, RecruiterJobUpdateRequest req);

    List<Job> getJobsByRecruiter(String email);
}
