package com.kavach.screenshots.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.net.URI;
import java.time.Duration;
import java.util.List;

/**
 * Wraps Cloudflare R2 (S3-compatible) for screenshot storage.
 * <p>
 * R2 has no egress fees and a 10 GB/month free tier — ideal for KAVACH.
 * We use pre-signed URLs (1-hour TTL) so parents can view screenshots
 * without ever exposing the bucket publicly.
 */
@Service
@Slf4j
public class R2StorageService {

    private final S3Client s3Client;
    private final S3Presigner presigner;

    @Value("${r2.bucket-name}")
    private String bucketName;

    /** True only when all three R2 credentials are configured. */
    private final boolean configured;

    public R2StorageService(
            @Value("${r2.account-id:}") String accountId,
            @Value("${r2.access-key-id:}") String accessKeyId,
            @Value("${r2.secret-access-key:}") String secretKey
    ) {
        if (accountId.isBlank() || accessKeyId.isBlank() || secretKey.isBlank()) {
            log.warn("[R2] R2 credentials not configured — screenshot storage is DISABLED");
            this.s3Client = null;
            this.presigner = null;
            this.configured = false;
            return;
        }

        String endpoint = "https://" + accountId + ".r2.cloudflarestorage.com";
        AwsBasicCredentials creds = AwsBasicCredentials.create(accessKeyId, secretKey);
        StaticCredentialsProvider cp = StaticCredentialsProvider.create(creds);

        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(cp)
                .region(Region.of("auto"))
                .build();

        this.presigner = S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(cp)
                .region(Region.of("auto"))
                .build();

        this.configured = true;
        log.info("[R2] Cloudflare R2 storage initialised (endpoint: {})", endpoint);
    }

    // ── Public API ────────────────────────────────────────────────────────────

    public boolean isConfigured() {
        return configured;
    }

    /**
     * Upload raw bytes to R2.
     *
     * @param key         object key (path) inside the bucket
     * @param imageBytes  JPEG bytes
     * @param contentType e.g. "image/jpeg"
     * @return the key (unchanged) for reference in DB
     */
    public String uploadScreenshot(String key, byte[] imageBytes, String contentType) {
        if (!configured) {
            log.debug("[R2] Upload skipped — not configured");
            return key;
        }
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromBytes(imageBytes)
        );
        log.debug("[R2] Uploaded {} bytes to key={}", imageBytes.length, key);
        return key;
    }

    /**
     * Generate a time-limited pre-signed GET URL.
     * Valid for 1 hour — short enough that parents cannot share a
     * permanent link outside the app.
     */
    public String generatePresignedUrl(String key) {
        if (!configured) return "";

        GetObjectPresignRequest req = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofHours(1))
                .getObjectRequest(r -> r.bucket(bucketName).key(key))
                .build();

        return presigner.presignGetObject(req).url().toString();
    }

    /** Hard-delete an object from R2. */
    public void deleteObject(String key) {
        if (!configured) return;
        s3Client.deleteObject(b -> b.bucket(bucketName).key(key));
        log.debug("[R2] Deleted key={}", key);
    }

    /**
     * Delete all objects under a prefix whose key date-component is
     * before {@code cutoffPrefix} (format: "YYYY-MM-DD").
     * Key format assumed: tenantId/deviceId/YYYY-MM-DD/timestamp.jpg
     */
    public void purgeByPrefix(String prefix, String cutoffDateStr) {
        if (!configured) return;

        ListObjectsV2Response resp = s3Client.listObjectsV2(
                b -> b.bucket(bucketName).prefix(prefix)
        );

        List<String> toDelete = resp.contents().stream()
                .filter(obj -> {
                    String[] parts = obj.key().split("/");
                    if (parts.length < 3) return false;
                    try {
                        return parts[2].compareTo(cutoffDateStr) < 0;
                    } catch (Exception e) {
                        return false;
                    }
                })
                .map(S3Object::key)
                .toList();

        toDelete.forEach(this::deleteObject);
        if (!toDelete.isEmpty()) {
            log.info("[R2] Purged {} old screenshots under prefix={}", toDelete.size(), prefix);
        }
    }
}
