package com.helpinghands.application.dto.childrenshome;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChildrensHomeRegistrationRequest(
        @NotBlank @Size(max = 200) String homeName,
        @NotBlank @Size(max = 80) String registrationNumber,
        @NotBlank @Size(max = 20) String contactNumber,
        @NotBlank @Email @Size(max = 150) String contactEmail,
        @NotBlank @Size(max = 500) String address,
        @Size(max = 2000) String description
) {
}
