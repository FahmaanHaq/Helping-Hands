package com.helpinghands.infrastructure.email;

public interface EmailService {
    void sendVerificationEmail(String toEmail, String recipientName, String verificationLink);
    void sendPasswordResetEmail(String toEmail, String recipientName, String resetLink);
}
