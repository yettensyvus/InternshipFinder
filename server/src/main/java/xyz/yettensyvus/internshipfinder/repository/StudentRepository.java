package xyz.yettensyvus.internshipfinder.repository;

import xyz.yettensyvus.internshipfinder.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Student findByUserId(Long userId);
    Optional<Student> findByUserEmail(String email);
}
