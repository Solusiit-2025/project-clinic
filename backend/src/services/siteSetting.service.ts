import { prisma } from '../lib/prisma';

export class SiteSettingService {
  async getAllSettings() {
    return await prisma.siteSetting.findMany();
  }

  async getSettingByKey(key: string) {
    return await prisma.siteSetting.findUnique({
      where: { key },
    });
  }

  async updateSetting(key: string, value: any, description?: string) {
    return await prisma.siteSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }

  async deleteSetting(key: string) {
    return await prisma.siteSetting.delete({
      where: { key },
    });
  }
}
