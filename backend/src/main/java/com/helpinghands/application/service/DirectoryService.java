package com.helpinghands.application.service;

import com.helpinghands.application.dto.directory.DirectoryUserResponse;
import com.helpinghands.domain.entity.RoleName;
import com.helpinghands.domain.entity.User;
import com.helpinghands.infrastructure.repository.RatingRepository;
import com.helpinghands.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Answers the SRS's "View Donors" use case for Children's Homes. Deliberately
 * exposes a narrow DTO (name, username, reputation) — never email, phone,
 * or address, which stay private even from other legitimate platform users.
 */
@Service
@RequiredArgsConstructor
public class DirectoryService {

    private final UserRepository userRepository;
    private final RatingRepository ratingRepository;

    @Transactional(readOnly = true)
    public List<DirectoryUserResponse> listDonors() {
        return userRepository.findAllActiveByRoleName(RoleName.DONOR).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DirectoryUserResponse> listServiceProviders() {
        return userRepository.findAllActiveByRoleName(RoleName.SERVICE_PROVIDER).stream()
                .map(this::toResponse)
                .toList();
    }

    private DirectoryUserResponse toResponse(User user) {
        Double average = ratingRepository.findAverageScoreByRatedUserId(user.getId());
        long total = ratingRepository.countByRatedUserIdAndIsActiveTrue(user.getId());
        return new DirectoryUserResponse(user.getId(), user.getFullName(), user.getUsername(), average, total);
    }
}
