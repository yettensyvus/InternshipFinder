package xyz.yettensyvus.internshipfinder.service;

import xyz.yettensyvus.internshipfinder.enums.Status;

import xyz.yettensyvus.internshipfinder.model.Application;

import java.util.List;

public interface ApplicationService {

    String applyToJobByEmail(String email, Long jobId);

    List<Application> getApplicationsByEmail(String email);

    List<Application> getApplicationsByJobForRecruiter(String recruiterEmail, Long jobId);

    Application updateApplicationStatusForRecruiter(String recruiterEmail, Long applicationId, Status status);
}
