import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand , DeleteObjectCommand} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';


@Injectable()
export class S3Service {
  private client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  async getUploadUrl(params: {
    tenantId: string;
    courseId: string;
    filename: string;
    contentType: string;
  }) {
    const videoId = randomUUID();

    const key = `videos/tenant-${params.tenantId}/course-${params.courseId}/${videoId}/source-${params.filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType: params.contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 300, // 5 minutes
    });

    return {
      upload_url: uploadUrl,
      key,
      video_id: videoId,
    };
  }

  async getPreviewUrl(s3Key: string) {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: s3Key,
    });

    const previewUrl = await getSignedUrl(this.client, command, {
      expiresIn: 600, // 10 minutes
    });

    return previewUrl;
  }

  async deleteObject(s3Key: string) {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: s3Key,
    });

    await this.client.send(command);
  }

}
