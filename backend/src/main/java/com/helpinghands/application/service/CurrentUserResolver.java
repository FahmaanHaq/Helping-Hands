package com.helpinghands.application.service;

import com.helpinghands.api.exception.ApiException;
import com.helpinghands.domain.entity.User;
import com.helpinghands.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserResolver {

    private final UserRepository userRepository;

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ApiException("Not authenticated", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByUsernameAndIsActiveTrue(authentication.getName())
                .orElseThrow(() -> new ApiException("Authenticated user not found", HttpStatus.UNAUTHORIZED));
    }

    /**
     * Hard gate for actions that shouldn't be available until the user has
     * proven they own their email address — registering a profile, posting
     * or pledging to a request, submitting a rating. Deliberately NOT used
     * for login, browsing, or read-only lookups: verification nags the user
     * without locking them out entirely, until they attempt one of these
     * specific write actions.
     */
    public User getCurrentVerifiedUser() {
        User user = getCurrentUser();
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new ApiException(
                    "Please verify your email address before doing this. Check your inbox for the verification link, " +
                    "or use \"Resend email\" if you can't find it.",
                    HttpStatus.FORBIDDEN);
        }
        return user;
    }
}
