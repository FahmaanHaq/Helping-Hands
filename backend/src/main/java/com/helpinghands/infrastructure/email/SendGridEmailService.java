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
 * Sends email via SendGrid's REST API. This exists specifically because
 * Resend's default onboarding@resend.dev sender only delivers to the email
 * address that owns the Resend account — every other recipient gets a
 * silent-looking 403 ("You can only send testing emails to your own email
 * address... verify a domain to send to other recipients"). Verifying a
 * domain is the "real" fix, but requires owning a domain and configuring
 * DNS records.
 *
 * SendGrid (and Brevo) offer a lighter alternative: Single Sender
 * Verification — verify just one email address you already own (click a
 * confirmation link, no DNS involved), and send to any recipient from that
 * address. That's the gap this class closes.
 *
 * Active when app.email-provider=sendgrid. Same @Async, same
 * never-throws-to-the-caller error handling as ResendEmailService and
 * SmtpEmailService — a provider outage should never fail the request that
 * triggered the email.
 */
@Service
@ConditionalOnProperty(name = "app.email-provider", havingValue = "sendgrid")
public class SendGridEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(SendGridEmailService.class);
    private static final String SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${sendgrid.api-key}")
    private String apiKey;

    @Value("${sendgrid.from-address}")
    private String fromAddress;

    @Value("${sendgrid.from-name:Helping Hands}")
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
            Map<String, Object> toEntry = Map.of("email", toEmail);
            Map<String, Object> personalization = Map.of("to", List.of(toEntry));

            Map<String, Object> from = new LinkedHashMap<>();
            from.put("email", fromAddress);
            from.put("name", fromName);

            Map<String, Object> content = Map.of("type", "text/html", "value", htmlBody);

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("personalizations", List.of(personalization));
            payload.put("from", from);
            payload.put("subject", subject);
            payload.put("content", List.of(content));

            String json = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(SENDGRID_API_URL))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            // SendGrid returns 202 Accepted with an empty body on success —
            // anything else is treated as a failure worth logging.
            if (response.statusCode() != 202) {
                log.error("SendGrid API rejected email to {}: HTTP {} — {}", toEmail, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }
}
