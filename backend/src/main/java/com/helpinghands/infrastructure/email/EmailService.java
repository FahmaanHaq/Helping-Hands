package com.helpinghands.infrastructure.email;

public interface EmailService {
    void sendVerificationEmail(String toEmail, String recipientName, String verificationLink);
    void sendPasswordResetEmail(String toEmail, String recipientName, String resetLink);
    void sendNotificationEmail(String toEmail, String recipientName, String subject, String message, String actionLink);
    void sendMfaCodeEmail(String toEmail, String recipientName, String code);
}
