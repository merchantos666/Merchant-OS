import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const REGION = process.env.AWS_REGION
const BUCKET = process.env.S3_BUCKET

export function getS3Client() {
  if (!REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Faltan credenciales de AWS (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)')
  }
  return new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
}

export async function getSignedPutUrl(key: string, contentType: string, expiresInSeconds = 900) {
  if (!BUCKET) throw new Error('S3_BUCKET no configurado')
  const client = getS3Client()
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ACL: 'private',
  })
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

export async function getSignedGetUrl(key: string, expiresInSeconds = 60 * 60 * 24) {
  if (!BUCKET) throw new Error('S3_BUCKET no configurado')
  const client = getS3Client()
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

export function s3BucketName() {
  if (!BUCKET) throw new Error('S3_BUCKET no configurado')
  return BUCKET
}
