package com.helpinghands.domain.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ServiceProviderTest {

    private ServiceProvider providerWith(VerificationStatus status, boolean clearanceRequired, boolean clearanceVerified) {
        ServiceProvider provider = new ServiceProvider();
        provider.setVerificationStatus(status);
        provider.setPoliceClearanceRequired(clearanceRequired);
        provider.setPoliceClearanceVerified(clearanceVerified);
        return provider;
    }

    @Test
    void approvedOnlineOnlyProvider_isEligible_evenWithoutClearance() {
        ServiceProvider provider = providerWith(VerificationStatus.APPROVED, false, false);
        assertTrue(provider.isEligibleToOfferServices());
    }

    @Test
    void approvedOnsiteProvider_withVerifiedClearance_isEligible() {
        ServiceProvider provider = providerWith(VerificationStatus.APPROVED, true, true);
        assertTrue(provider.isEligibleToOfferServices());
    }

    @Test
    void approvedOnsiteProvider_withoutVerifiedClearance_isNotEligible() {
        ServiceProvider provider = providerWith(VerificationStatus.APPROVED, true, false);
        assertFalse(provider.isEligibleToOfferServices(),
                "Onsite providers must have verified police clearance before they're eligible");
    }

    @Test
    void pendingProvider_isNeverEligible_regardlessOfClearance() {
        ServiceProvider provider = providerWith(VerificationStatus.SUBMITTED, true, true);
        assertFalse(provider.isEligibleToOfferServices());
    }

    @Test
    void rejectedProvider_isNeverEligible() {
        ServiceProvider provider = providerWith(VerificationStatus.REJECTED, false, false);
        assertFalse(provider.isEligibleToOfferServices());
    }
}
