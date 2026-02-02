package xyz.yettensyvus.internshipfinder.repository;

import xyz.yettensyvus.internshipfinder.model.Job;
import xyz.yettensyvus.internshipfinder.model.Recruiter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByIsActiveTrue();
    List<Job> findByIsActiveTrueAndPaid(boolean paid);
    List<Job> findByRecruiter(Recruiter recruiter);
}
