import { prisma } from '../lib/prisma';

export class SiteSettingService {
  async getAllSettings() {
    const dbSettings = await prisma.siteSetting.findMany();

    try {
      // Find the main clinic, or the first active clinic
      const mainClinic = await prisma.clinic.findFirst({
        where: { isActive: true },
        orderBy: [
          { isMain: 'desc' },
          { createdAt: 'asc' }
        ]
      });

      if (mainClinic) {
        const dynamicKeys = {
          brandName: mainClinic.name,
          brandShort: mainClinic.name.replace(/\s*(Pusat|Cabang.*)$/i, ''),
          contact: {
            phone: mainClinic.phone || '251-866-616-9',
            email: mainClinic.email || 'info@yasfina.com',
            address: mainClinic.address || '',
            hours: 'Senin - Sabtu: 08:00 - 21:00'
          }
        };

        for (const [key, value] of Object.entries(dynamicKeys)) {
          const exists = dbSettings.some(s => s.key === key);
          if (!exists) {
            dbSettings.push({
              id: `dynamic-${key}`,
              key,
              value: value as any,
              description: `Dynamic setting from clinic: ${mainClinic.name}`,
              updatedAt: mainClinic.updatedAt,
              clinicId: mainClinic.id
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to inject dynamic clinic settings:', error);
    }

    return dbSettings;
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
