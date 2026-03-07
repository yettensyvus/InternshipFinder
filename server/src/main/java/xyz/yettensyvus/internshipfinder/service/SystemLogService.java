package xyz.yettensyvus.internshipfinder.service;

import xyz.yettensyvus.internshipfinder.model.SystemLog;
import java.util.List;

public interface SystemLogService {
    void log(String action, String details, String userEmail, String ipAddress, SystemLog.LogLevel level);
    void info(String action, String details, String userEmail);
    void warn(String action, String details, String userEmail);
    void error(String action, String details, String userEmail);
    List<SystemLog> getRecentLogs();
}
