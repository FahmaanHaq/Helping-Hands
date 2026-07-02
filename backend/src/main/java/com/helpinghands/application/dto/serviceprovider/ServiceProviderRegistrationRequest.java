package com.helpinghands.application.dto.serviceprovider;

import com.helpinghands.domain.entity.ServiceCategory;
import com.helpinghands.domain.entity.ServiceMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record ServiceProviderRegistrationRequest(
        @NotBlank @Size(max = 500) String skills,
        @Size(max = 2000) String qualifications,
        @NotEmpty Set<ServiceCategory> serviceCategories,
        @NotNull ServiceMode serviceMode
) {
}
