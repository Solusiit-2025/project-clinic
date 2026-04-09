import { Router } from 'express';
import { SiteSettingController } from '../controllers/siteSetting.controller';

const router = Router();
const siteSettingController = new SiteSettingController();

router.get('/', siteSettingController.getSettings);
router.post('/', siteSettingController.updateSetting); // Using POST for upsert

export default router;
