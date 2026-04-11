import { Router } from 'express';
import { SiteSettingController } from '../controllers/siteSetting.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadVideo } from '../middleware/videoUpload.middleware';

const router = Router();
const siteSettingController = new SiteSettingController();

router.get('/', siteSettingController.getSettings);
router.post('/', authMiddleware, siteSettingController.updateSetting); // Using POST for upsert

// Video display settings
router.post('/display-video', authMiddleware, uploadVideo.single('video'), siteSettingController.uploadDisplayVideo);
router.delete('/display-video/:filename', authMiddleware, siteSettingController.deleteDisplayVideo);

export default router;
