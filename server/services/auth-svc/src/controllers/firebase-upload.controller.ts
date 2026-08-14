import { JsonController, Post, Req, Res } from "routing-controllers";
import { FirebaseUploadService } from "../services/firbase-upload.service";
import { Request, Response } from 'express';
import { upload } from "../utils/config/multer.config";

@JsonController('/auth/firebase')
export class FirebaseUploadController {
    private firebaseUploadService: FirebaseUploadService;

    constructor() {
        this.firebaseUploadService = new FirebaseUploadService();
    }

    @Post("/upload")
    async uploadFile(@Req() req: Request, @Res() res: Response) {

        await new Promise<void>((resolve, reject) => {
            upload.single('file')(req as any, res as any, (err) => (err ? reject(err) : resolve()));

        }).catch(err => {
            return res.status(400).json({ error: err.message || 'File upload failed' });
        });

        if (!req.file) return res.status(400).json({ error: 'No file provided' });

        const result = await this.firebaseUploadService.UploadFileAndUpdateUser(req.file, req.body.user_id);
        return res.json({ success: true, result });
    }
}