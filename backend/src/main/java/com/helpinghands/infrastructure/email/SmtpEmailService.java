package com.helpinghands.infrastructure.email;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class SmtpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailService.class);

    private final JavaMailSender mailSender;

    @Value("${mail.from-address}")
    private String fromAddress;

    @Override
    public void sendVerificationEmail(String toEmail, String recipientName, String verificationLink) {
        String subject = "Verify your Helping Hands account";
        String body = """
                <p>Hi %s,</p>
                <p>Thanks for registering with Helping Hands. Please confirm your email address to activate your account:</p>
                <p><a href="%s">Verify my email</a></p>
                <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
                """.formatted(recipientName, verificationLink);
        send(toEmail, subject, body);
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String recipientName, String resetLink) {
        String subject = "Reset your Helping Hands password";
        String body = """
                <p>Hi %s,</p>
                <p>We received a request to reset your Helping Hands password. Click below to choose a new one:</p>
                <p><a href="%s">Reset my password</a></p>
                <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email —
                your password will not be changed.</p>
                """.formatted(recipientName, resetLink);
        send(toEmail, subject, body);
    }

    private void send(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (Exception e) {
            // Deliberately don't rethrow: a transient email-provider outage
            // shouldn't fail registration or the password-reset request itself
            // (the token still exists and can be resent). Logged for visibility.
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }
}
