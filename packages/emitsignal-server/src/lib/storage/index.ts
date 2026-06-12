import type { FileStorage } from './provider';

import { type Environment } from '../../schema/environment';
import { LocalFileStorage } from './local-provider';
import { S3FileStorage } from './s3-provider';

export class FileStorageService {
    static get provider(): FileStorage {
        if (!FileStorageService.instance) {
            throw new Error(
                'FileStorage not initialized — call FileStorageService.init() at startup',
            );
        }

        return FileStorageService.instance;
    }

    private static instance: FileStorage | null = null;

    static init(env: Environment): FileStorage {
        if (FileStorageService.instance) {
            return FileStorageService.instance;
        }

        switch (env.FILE_STORAGE_PROVIDER) {
            case 's3': {
                if (!env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY || !env.S3_BUCKET_NAME) {
                    throw new Error(
                        'S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY and S3_BUCKET_NAME are required when FILE_STORAGE_PROVIDER=s3',
                    );
                }

                FileStorageService.instance = new S3FileStorage({
                    accessKeyId: env.S3_ACCESS_KEY_ID,
                    bucket: env.S3_BUCKET_NAME,
                    endpoint: env.S3_ENDPOINT,
                    forcePathStyle: env.S3_FORCE_PATH_STYLE,
                    publicUrlBase: env.S3_PUBLIC_URL_BASE,
                    region: env.S3_REGION,
                    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
                });
                break;
            }
            default:
                FileStorageService.instance = new LocalFileStorage(env.API_URL, env.UPLOAD_DIR);
        }

        return FileStorageService.instance;
    }
}

export { AVATAR_MAX_SIZE, isAllowedMimeType } from './provider';
export type { FileMetadata, FileUploadInput } from './provider';
