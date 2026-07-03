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
 * Sends email via Brevo's (formerly Sendinblue) REST API. A second
 * alternative alongside SendGrid for the same underlying problem — Resend's
 * free sender only delivers to the account owner's own address without a
 * verified domain — for cases where SendGrid's signup process itself is the
 * blocker (SendGrid has been rejecting/flagging some new signups; this is
 * not something wrong with this codebase's SendGrid integration, just an
 * account-creation issue on their end).
 *
 * Same single-sender-verification model as SendGrid: verify one email
 * address you own (Brevo dashboard -> Senders, Domains & Dedicated IPs ->
 * Senders -> click the confirmation link they email you), no DNS/domain
 * required, then send to any recipient from that address.
 *
 * Active when app.email-provider=brevo. Same @Async, never-throws-to-caller
 * error handling as the other three EmailService implementations.
 */
@Service
@ConditionalOnProperty(name = "app.email-provider", havingValue = "brevo")
public class BrevoEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailService.class);
    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${brevo.from-address}")
    private String fromAddress;

    @Value("${brevo.from-name:Helping Hands}")
    private String fromName;

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
            Map<String, Object> sender = new LinkedHashMap<>();
            sender.put("name", fromName);
            sender.put("email", fromAddress);

            Map<String, Object> recipient = Map.of("email", toEmail);

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sender", sender);
            payload.put("to", List.of(recipient));
            payload.put("subject", subject);
            payload.put("htmlContent", htmlBody);

            String json = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .timeout(Duration.ofSeconds(10))
                    .header("api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            // Brevo returns 201 Created with a messageId on success.
            if (response.statusCode() != 201) {
                log.error("Brevo API rejected email to {}: HTTP {} — {}", toEmail, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }
}
