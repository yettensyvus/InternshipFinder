package xyz.yettensyvus.internshipfinder.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import xyz.yettensyvus.internshipfinder.model.SystemLog;
import xyz.yettensyvus.internshipfinder.repository.SystemLogRepository;
import xyz.yettensyvus.internshipfinder.service.SystemLogService;

import java.util.List;

@Service
public class SystemLogServiceImpl implements SystemLogService {

    @Autowired
    private SystemLogRepository logRepo;

    @Override
    public void log(String action, String details, String userEmail, String ipAddress, SystemLog.LogLevel level) {
        SystemLog entry = SystemLog.builder()
                .action(action)
                .details(details)
                .userEmail(userEmail)
                .ipAddress(ipAddress)
                .level(level)
                .build();
        logRepo.save(entry);
    }

    @Override
    public void info(String action, String details, String userEmail) {
        log(action, details, userEmail, null, SystemLog.LogLevel.INFO);
    }

    @Override
    public void warn(String action, String details, String userEmail) {
        log(action, details, userEmail, null, SystemLog.LogLevel.WARN);
    }

    @Override
    public void error(String action, String details, String userEmail) {
        log(action, details, userEmail, null, SystemLog.LogLevel.ERROR);
    }

    @Override
    public List<SystemLog> getRecentLogs() {
        return logRepo.findTop100ByOrderByTimestampDesc();
    }
}
