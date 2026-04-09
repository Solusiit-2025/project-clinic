import { Request, Response } from 'express';
import { SiteSettingService } from '../services/siteSetting.service';

const siteSettingService = new SiteSettingService();

export class SiteSettingController {
  async getSettings(req: Request, res: Response) {
    try {
      const settings = await siteSettingService.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  async updateSetting(req: Request, res: Response) {
    const { key, value, description } = req.body;
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and Value are required' });
    }

    try {
      const setting = await siteSettingService.updateSetting(key, value, description);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update setting' });
    }
  }
}
