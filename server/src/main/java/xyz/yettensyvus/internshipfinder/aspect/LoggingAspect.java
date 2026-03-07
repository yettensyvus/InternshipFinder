package xyz.yettensyvus.internshipfinder.aspect;

import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import xyz.yettensyvus.internshipfinder.model.SystemLog;
import xyz.yettensyvus.internshipfinder.service.SystemLogService;

import java.security.Principal;

@Aspect
@Component
public class LoggingAspect {

    @Autowired
    private SystemLogService logService;

    @Pointcut("within(xyz.yettensyvus.internshipfinder.controller.AdminController) || " +
              "within(xyz.yettensyvus.internshipfinder.controller.AuthController)")
    public void controllerMethods() {}

    @Around("controllerMethods()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        long startedAt = System.currentTimeMillis();

        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String action = className + "." + methodName;

        String userEmail = getRequesterEmail();
        String ipAddress = getClientIp();

        HttpServletRequest request = getRequest();
        String http = request != null ? request.getMethod() : null;
        String uri = request != null ? request.getRequestURI() : null;

        try {
            Object result = joinPoint.proceed();

            Integer status = extractStatus(result);
            long durationMs = System.currentTimeMillis() - startedAt;

            String details = buildDetails(http, uri, status, durationMs, null);
            SystemLog.LogLevel level = (status != null && status >= 400) ? SystemLog.LogLevel.WARN : SystemLog.LogLevel.INFO;

            logService.log(action, details, userEmail, ipAddress, level);
            return result;
        } catch (Throwable ex) {
            long durationMs = System.currentTimeMillis() - startedAt;
            String details = buildDetails(http, uri, 500, durationMs, ex);
            logService.log(action, details, userEmail, ipAddress, SystemLog.LogLevel.ERROR);
            throw ex;
        }
    }

    private Integer extractStatus(Object result) {
        if (result instanceof ResponseEntity<?> re && re.getStatusCode() != null) {
            return re.getStatusCode().value();
        }
        return 200;
    }

    private String buildDetails(String http, String uri, Integer status, long durationMs, Throwable ex) {
        StringBuilder sb = new StringBuilder();
        if (http != null && uri != null) {
            sb.append(http).append(' ').append(uri);
        } else {
            sb.append("REQUEST");
        }

        if (status != null) {
            sb.append(" | status=").append(status);
        }

        sb.append(" | durationMs=").append(durationMs);

        if (ex != null) {
            sb.append(" | exception=").append(ex.getClass().getSimpleName());
            if (ex.getMessage() != null && !ex.getMessage().isBlank()) {
                sb.append(": ").append(ex.getMessage());
            }
        }
        return sb.toString();
    }

    private String getRequesterEmail() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            Principal principal = attributes.getRequest().getUserPrincipal();
            if (principal != null) {
                return principal.getName();
            }
        }
        return "Anonymous";
    }

    private HttpServletRequest getRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) return null;
        return attributes.getRequest();
    }

    private String getClientIp() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader != null && !xfHeader.isBlank()) {
                return xfHeader.split(",")[0];
            }
            String realIp = request.getHeader("X-Real-IP");
            if (realIp != null && !realIp.isBlank()) {
                return realIp;
            }
            return request.getRemoteAddr();
        }
        return "Unknown";
    }
}
