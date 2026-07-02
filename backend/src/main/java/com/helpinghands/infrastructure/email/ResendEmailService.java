package com.helpinghands.infrastructure.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Sends email via Resend's REST API instead of SMTP. This is the actual fix
 * for the "Connect timed out" error on smtp.gmail.com:587 seen on Render —
 * that error isn't a credentials problem, it's Render's free/starter tier
 * blocking outbound SMTP ports (25/465/587) at the network level, before
 * the connection ever reaches Gmail. No SMTP configuration can work around
 * that; the only real fix is not using SMTP. An HTTPS API call on port 443
 * is never blocked the same way.
 *
 * This is the default active EmailService (app.email-provider=resend).
 * SmtpEmailService is still in the codebase, gated behind
 * app.email-provider=smtp, for the docker-compose/VPS self-hosting path
 * where outbound SMTP isn't blocked.
 */
@Service
@ConditionalOnProperty(name = "app.email-provider", havingValue = "resend", matchIfMissing = true)
public class ResendEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailService.class);
    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${resend.from-address}")
    private String fromAddress;

    @Override
    @Async
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
    @Async
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

    @Override
    @Async
    public void sendNotificationEmail(String toEmail, String recipientName, String subject, String message, String actionLink) {
        String linkHtml = actionLink != null
                ? "<p><a href=\"%s\">View details</a></p>".formatted(actionLink)
                : "";
        String body = """
                <p>Hi %s,</p>
                <p>%s</p>
                %s
                """.formatted(recipientName, message, linkHtml);
        send(toEmail, subject, body);
    }

    @Override
    @Async
    public void sendMfaCodeEmail(String toEmail, String recipientName, String code) {
        String subject = "Your Helping Hands admin login code";
        String body = """
                <p>Hi %s,</p>
                <p>Your one-time login code is:</p>
                <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">%s</p>
                <p>This code expires in 5 minutes. If you didn't try to log in, you can ignore this email —
                your account has not been accessed.</p>
                """.formatted(recipientName, code);
        send(toEmail, subject, body);
    }

    private void send(String toEmail, String subject, String htmlBody) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("from", fromAddress);
            payload.put("to", List.of(toEmail));
            payload.put("subject", subject);
            payload.put("html", htmlBody);

            String json = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RESEND_API_URL))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                log.error("Resend API rejected email to {}: HTTP {} — {}", toEmail, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            // Deliberately don't rethrow: a transient email-provider outage
            // shouldn't fail registration or the password-reset request itself
            // (the token still exists and can be resent). Logged for visibility.
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }
}
