package com.noithat.qlnt.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {
    
    private final Cloudinary cloudinary;
    
    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret) {
        
        // Check for CLOUDINARY_URL environment variable first (for deployment)
        String cloudinaryUrl = System.getenv("CLOUDINARY_URL");
        
        if (cloudinaryUrl != null && !cloudinaryUrl.isEmpty()) {
            // Use CLOUDINARY_URL if available (deployment environment)
            this.cloudinary = new Cloudinary(cloudinaryUrl);
        } else {
            // Fall back to individual properties (local development)
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
            ));
        }
    }
    
    /**
     * Upload image to Cloudinary
     * @param file MultipartFile to upload
     * @param folder Folder path in Cloudinary (e.g., "products/123")
     * @return Cloudinary URL of uploaded image
     * @throws IOException if upload fails
     */
    public String uploadImage(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        
        // Validate image type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("File must be an image");
        }
        
        // Upload to Cloudinary
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
            "folder", folder,
            "resource_type", "image",
            "overwrite", true
        ));
        
        // Return secure URL
        return (String) uploadResult.get("secure_url");
    }
    
    /**
     * Delete image from Cloudinary by URL
     * @param imageUrl Cloudinary URL to delete
     * @throws IOException if deletion fails
     */
    public void deleteImage(String imageUrl) throws IOException {
        if (imageUrl == null || !imageUrl.contains("cloudinary.com")) {
            return; // Skip if not a Cloudinary URL
        }
        
        // Extract public_id from URL
        // Example: https://res.cloudinary.com/dbswbz19h/image/upload/v1234567890/products/123/filename.jpg
        // public_id would be: products/123/filename
        String publicId = extractPublicId(imageUrl);
        
        if (publicId != null) {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        }
    }
    
    /**
     * Extract public_id from Cloudinary URL
     */
    private String extractPublicId(String imageUrl) {
        try {
            // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
            String[] parts = imageUrl.split("/upload/");
            if (parts.length < 2) return null;
            
            String afterUpload = parts[1];
            // Remove version (v1234567890/)
            String withoutVersion = afterUpload.replaceFirst("v\\d+/", "");
            // Remove file extension
            int dotIndex = withoutVersion.lastIndexOf('.');
            if (dotIndex > 0) {
                return withoutVersion.substring(0, dotIndex);
            }
            return withoutVersion;
        } catch (Exception e) {
            return null;
        }
    }
}
