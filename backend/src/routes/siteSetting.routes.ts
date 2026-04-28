import { Router } from 'express';
import { SiteSettingController } from '../controllers/siteSetting.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadVideo } from '../middleware/videoUpload.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();
const siteSettingController = new SiteSettingController();

router.get('/', siteSettingController.getSettings);
router.post('/', authMiddleware, siteSettingController.updateSetting); // Using POST for upsert

// Video display settings
router.post('/display-video', authMiddleware, uploadVideo.single('video'), siteSettingController.uploadDisplayVideo);
router.delete('/display-video/:filename', authMiddleware, siteSettingController.deleteDisplayVideo);

// Website image settings
router.post('/upload-image', authMiddleware, upload.single('image'), siteSettingController.uploadWebsiteImage);

export default router;
