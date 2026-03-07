package xyz.yettensyvus.internshipfinder.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import xyz.yettensyvus.internshipfinder.model.SystemLog;
import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    List<SystemLog> findAllByOrderByTimestampDesc();
    List<SystemLog> findTop100ByOrderByTimestampDesc();
}
