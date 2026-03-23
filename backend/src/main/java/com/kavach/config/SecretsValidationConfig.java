package com.kavach.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("!test")
public class SecretsValidationConfig {

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${r2.access-key-id:}")
    private String r2AccessKey;

    @Value("${r2.bucket-name:}")
    private String r2BucketName;

    @PostConstruct
    void validateSecrets() {
        // GAP-15 FIXED
        if (razorpayKeyId == null || razorpayKeyId.isBlank() || !razorpayKeyId.startsWith("rzp_")) {
            throw new IllegalStateException("Missing/invalid RAZORPAY_KEY_ID; expected a value starting with 'rzp_'.");
        }
        if (r2AccessKey == null || r2AccessKey.isBlank()) {
            throw new IllegalStateException("Missing R2_ACCESS_KEY.");
        }
        if (r2BucketName == null || r2BucketName.isBlank()) {
            throw new IllegalStateException("Missing R2_BUCKET_NAME.");
        }
    }
}
