package xyz.yettensyvus.internshipfinder.repository;

import xyz.yettensyvus.internshipfinder.model.Recruiter;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecruiterRepository extends JpaRepository<Recruiter, Long> {
    Recruiter findByUserId(Long userId);
    Recruiter findByUserEmail(String email);
}
