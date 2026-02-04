package xyz.yettensyvus.internshipfinder.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import xyz.yettensyvus.internshipfinder.enums.OtpPurpose;
import xyz.yettensyvus.internshipfinder.model.OtpToken;
import xyz.yettensyvus.internshipfinder.model.User;

import java.time.Instant;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    Optional<OtpToken> findTopByUserAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(User user, OtpPurpose purpose);

    @Modifying
    @Query("delete from OtpToken t where t.expiresAt < :now or t.consumedAt is not null")
    int deleteExpiredOrConsumed(@Param("now") Instant now);
}
