package xyz.yettensyvus.internshipfinder.config;

import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class AzureConfig {

    private final Environment environment;

    public AzureConfig(Environment environment) {
        this.environment = environment;
    }

    @Bean
    public BlobContainerClient blobContainerClient() {
        String connectionString = getRequiredSetting(
                "azure.storage.connection-string",
                "AZURE_STORAGE_CONNECTION_STRING"
        );
        String containerName = getRequiredSetting(
                "azure.storage.container-name",
                "AZURE_STORAGE_CONTAINER_NAME"
        );

        BlobServiceClient blobServiceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();

        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        if (!containerClient.exists()) {
            containerClient.create();
        }
        return containerClient;
    }

    private String getRequiredSetting(String propertyKey, String envKey) {
        String fromProps = environment.getProperty(propertyKey);
        if (fromProps != null && !fromProps.isBlank()) {
            return fromProps;
        }

        String fromEnv = System.getenv(envKey);
        if (fromEnv != null && !fromEnv.isBlank()) {
            return fromEnv;
        }

        throw new IllegalStateException("Missing configuration: " + propertyKey + " (or env " + envKey + ")");
    }
}
