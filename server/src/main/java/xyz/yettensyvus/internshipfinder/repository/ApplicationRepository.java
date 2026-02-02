package xyz.yettensyvus.internshipfinder.repository;

import xyz.yettensyvus.internshipfinder.model.Application;
import xyz.yettensyvus.internshipfinder.model.Job;
import xyz.yettensyvus.internshipfinder.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByStudent(Student student);
    List<Application> findByJob(Job job);
    boolean existsByStudentAndJob(Student student, Job job);
    @Modifying
    @Transactional
    void deleteByStudent(Student student);
    @Modifying
    @Transactional
    void deleteByJob(Job job);
}
