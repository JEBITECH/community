import { User } from "@shared/entities";
import { bucket } from "../utils/firebase";
import * as path from 'path';
import { Repository } from "typeorm";
import { AppDataSource } from "../db";
import dayjs from 'dayjs';
export class FirebaseUploadService {
    private userRepo: Repository<User>;
    constructor() {
        this.userRepo = AppDataSource.getRepository(User);
    }


    async UploadFileAndUpdateUser(file: Express.Multer.File, userId: string) {
        const url = await this.uploadFile(file);
        const user = await this.userRepo.findOne({ where: { id: userId } });
        const fileName = url?.split('/').pop();
        user.docs ??= [];
        user.docs.push({
            url: url,
            name: fileName,
            dateandtime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            description: ""
        });
        await this.userRepo.save(user);
        return {
            fileName,
            url: url
        };
    }

    async uploadFile(file: Express.Multer.File) {
        console.log('reqservice 11 !!!!!!!: ')
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');

        const fileName = `erp/${baseName}-${Date.now()}${ext}`;
        const fileUpload = bucket.file(fileName);

        try {
            await fileUpload.save(file.buffer, {
                metadata: {
                    contentType: file.mimetype
                }
            });
        } catch (err) {
            throw new Error(`Failed to upload file: ${err.message}`);
        }
        console.log('reqservice 27 !!!!!!!: ')
        await fileUpload.makePublic();
        console.log('reqservice 11 !!!!!!!: ')
        const publicUrl = fileUpload.publicUrl();
        return publicUrl;
    }
}