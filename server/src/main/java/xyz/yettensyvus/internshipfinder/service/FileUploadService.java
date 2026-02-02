package xyz.yettensyvus.internshipfinder.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileUploadService {

    String uploadFile(MultipartFile file, String folder);

    String toReadSasUrl(String storedUrlOrBlobName);

    String toStableBlobUrl(String storedUrlOrBlobName);

    void deleteFileIfExists(String storedUrlOrBlobName);
}
