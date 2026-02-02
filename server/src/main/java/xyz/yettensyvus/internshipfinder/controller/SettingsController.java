package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.dto.*;
import xyz.yettensyvus.internshipfinder.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin
public class SettingsController {

    @Autowired
    private UserService userService;

    @PostMapping("/request-email-change")
    public ResponseEntity<String> requestEmailChange(@Valid @RequestBody ChangeEmailRequest req) {
        return ResponseEntity.ok(userService.requestEmailChange(req.getNewEmail()));
    }

    @PostMapping("/confirm-email-change")
    public ResponseEntity<String> confirmEmailChange(@Valid @RequestBody ConfirmEmailChangeRequest req) {
        return ResponseEntity.ok(userService.confirmEmailChange(req.getOtp()));
    }

    @PostMapping("/request-password-change")
    public ResponseEntity<String> requestPasswordChange(@Valid @RequestBody ChangePasswordRequest req) {
        return ResponseEntity.ok(userService.requestPasswordChange(req.getCurrentPassword()));
    }

    @PostMapping("/confirm-password-change")
    public ResponseEntity<String> confirmPasswordChange(@Valid @RequestBody ConfirmPasswordChangeRequest req) {
        return ResponseEntity.ok(
                userService.confirmPasswordChange(req.getOtp(), req.getCurrentPassword(), req.getNewPassword())
        );
    }
}
