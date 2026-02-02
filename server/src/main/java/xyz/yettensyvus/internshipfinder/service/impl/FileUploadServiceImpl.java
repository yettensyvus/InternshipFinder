package xyz.yettensyvus.internshipfinder.service.impl;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.azure.storage.blob.sas.BlobSasPermission;
import com.azure.storage.blob.sas.BlobServiceSasSignatureValues;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import xyz.yettensyvus.internshipfinder.service.FileUploadService;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class FileUploadServiceImpl implements FileUploadService {

    @Autowired
    private BlobContainerClient blobContainerClient;

    @Autowired
    private Environment environment;

    @Override
    public String uploadFile(MultipartFile file, String folder) {
        try {
            String originalName = file.getOriginalFilename();
            String ext = "";
            if (originalName != null) {
                int idx = originalName.lastIndexOf('.');
                if (idx >= 0 && idx < originalName.length() - 1) {
                    ext = originalName.substring(idx);
                }
            }

            String safeFolder = (folder == null || folder.isBlank()) ? "uploads" : folder;
            String blobName = safeFolder + "/" + Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + ext;

            BlobClient blobClient = blobContainerClient.getBlobClient(blobName);

            byte[] bytes = file.getBytes();
            blobClient.upload(new ByteArrayInputStream(bytes), bytes.length, true);

            String contentType = file.getContentType();
            if (contentType != null && !contentType.isBlank()) {
                blobClient.setHttpHeaders(new BlobHttpHeaders().setContentType(contentType));
            }

            return blobClient.getBlobUrl();
        } catch (IOException e) {
            throw new RuntimeException("Upload failed", e);
        }
    }

    @Override
    public String toReadSasUrl(String storedUrlOrBlobName) {
        if (storedUrlOrBlobName == null || storedUrlOrBlobName.isBlank()) {
            return storedUrlOrBlobName;
        }

        String blobName = extractBlobName(storedUrlOrBlobName);
        BlobClient blobClient = blobContainerClient.getBlobClient(blobName);

        BlobSasPermission permission = new BlobSasPermission().setReadPermission(true);
        OffsetDateTime expiry = OffsetDateTime.now().plus(getSasExpiry());

        BlobServiceSasSignatureValues values = new BlobServiceSasSignatureValues(expiry, permission);
        String sas = blobClient.generateSas(values);
        return blobClient.getBlobUrl() + "?" + sas;
    }

    @Override
    public String toStableBlobUrl(String storedUrlOrBlobName) {
        if (storedUrlOrBlobName == null || storedUrlOrBlobName.isBlank()) {
            return storedUrlOrBlobName;
        }

        String blobName = extractBlobName(storedUrlOrBlobName);
        return blobContainerClient.getBlobClient(blobName).getBlobUrl();
    }

    @Override
    public void deleteFileIfExists(String storedUrlOrBlobName) {
        if (storedUrlOrBlobName == null || storedUrlOrBlobName.isBlank()) {
            return;
        }

        String blobName = extractBlobName(storedUrlOrBlobName);
        BlobClient blobClient = blobContainerClient.getBlobClient(blobName);
        blobClient.deleteIfExists();
    }

    private Duration getSasExpiry() {
        String raw = environment.getProperty("azure.storage.sas.expiry-minutes");
        if (raw == null || raw.isBlank()) {
            return Duration.ofMinutes(60);
        }
        try {
            long minutes = Long.parseLong(raw.trim());
            if (minutes <= 0) {
                return Duration.ofMinutes(60);
            }
            return Duration.ofMinutes(minutes);
        } catch (NumberFormatException ex) {
            return Duration.ofMinutes(60);
        }
    }

    private String extractBlobName(String storedUrlOrBlobName) {
        if (!storedUrlOrBlobName.startsWith("http://") && !storedUrlOrBlobName.startsWith("https://")) {
            return storedUrlOrBlobName;
        }

        try {
            URI uri = URI.create(storedUrlOrBlobName);
            String path = uri.getPath();
            if (path == null) {
                return storedUrlOrBlobName;
            }

            String normalized = path.startsWith("/") ? path.substring(1) : path;
            String container = blobContainerClient.getBlobContainerName();
            String prefix = container + "/";
            if (normalized.startsWith(prefix)) {
                normalized = normalized.substring(prefix.length());
            }

            return URLDecoder.decode(normalized, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            return storedUrlOrBlobName;
        }
    }
}
