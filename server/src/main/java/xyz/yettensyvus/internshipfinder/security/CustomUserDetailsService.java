package xyz.yettensyvus.internshipfinder.security;

import xyz.yettensyvus.internshipfinder.model.User;
import xyz.yettensyvus.internshipfinder.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.authentication.DisabledException;
import org.springframework.stereotype.Service;
import xyz.yettensyvus.internshipfinder.enums.Role;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepo;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (!user.isEnabled()) {
            if (user.getRole() == Role.RECRUITER && !user.isRecruiterEmailVerified()) {
                throw new DisabledException("EMAIL_NOT_VERIFIED");
            }
            if (user.getRole() == Role.STUDENT && !user.isStudentEmailVerified()) {
                throw new DisabledException("EMAIL_NOT_VERIFIED");
            }
            throw new DisabledException("ACCOUNT_BLOCKED");
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
