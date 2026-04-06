package com.example.pawchain.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.UUID;

/**
 * AWS S3 이미지 업로드 서비스
 *
 * 자격증명 우선순위:
 *   1. 환경변수 AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
 *   2. ~/.aws/credentials 파일
 *   3. EC2/ECS IAM Role (AWS 배포 시 권장)
 */
@Service
public class S3UploadService {

    private final String bucketName;
    private final String region;
    private S3Client s3Client;

    public S3UploadService(
        @Value("${aws.s3.bucket-name:pawchain-images}") String bucketName,
        @Value("${aws.region:ap-northeast-2}") String region
    ) {
        this.bucketName = bucketName;
        this.region = region;
    }

    @PostConstruct
    public void init() {
        this.s3Client = S3Client.builder()
            .region(Region.of(region))
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
    }

    /**
     * S3에 이미지를 업로드하고 공개 URL을 반환합니다.
     *
     * @param file     업로드할 MultipartFile
     * @param folder   S3 내 폴더 경로 (예: "pets", "medical")
     * @return S3 공개 URL
     */
    public String uploadImage(MultipartFile file, String folder) throws IOException {
        validateImageFile(file);

        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);
        String s3Key = folder + "/" + UUID.randomUUID() + extension;

        PutObjectRequest putRequest = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(s3Key)
            .contentType(file.getContentType())
            .contentLength(file.getSize())
            .build();

        s3Client.putObject(putRequest, RequestBody.fromBytes(file.getBytes()));

        return buildPublicUrl(s3Key);
    }

    /**
     * S3 객체를 삭제합니다. (이미지 교체 시 구 이미지 정리용)
     *
     * @param s3Key S3 객체 키 (URL에서 파싱하거나 DB에서 조회)
     */
    public void deleteImage(String s3Key) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
            .bucket(bucketName)
            .key(s3Key)
            .build());
    }

    /** S3 버킷의 공개 URL을 생성합니다. */
    public String buildPublicUrl(String s3Key) {
        return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + s3Key;
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 없습니다.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("파일 크기는 10MB 이하여야 합니다.");
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }
}
