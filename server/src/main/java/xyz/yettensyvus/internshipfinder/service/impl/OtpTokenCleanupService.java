package xyz.yettensyvus.internshipfinder.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.yettensyvus.internshipfinder.repository.OtpTokenRepository;

import java.time.Instant;

@Service
public class OtpTokenCleanupService {

    @Autowired
    private OtpTokenRepository otpTokenRepository;

    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void cleanup() {
        otpTokenRepository.deleteExpiredOrConsumed(Instant.now());
    }
}
