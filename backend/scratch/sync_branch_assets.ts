
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Asset Synchronization ---');

  // 1. Get Pusat Assets
  const pusatAssets = await prisma.asset.findMany({
    where: { clinic: { code: 'K001' } }
  });

  if (pusatAssets.length === 0) {
    console.log('No assets found in Pusat (K001). Aborting.');
    return;
  }

  console.log(`Found ${pusatAssets.length} assets in Pusat.`);

  // 2. Get All Clinics
  const clinics = await prisma.clinic.findMany();
  const branches = clinics.filter(c => c.code !== 'K001');

  console.log(`Found ${branches.length} branches to sync.`);

  for (const branch of branches) {
    console.log(`Syncing branch: ${branch.name} (${branch.code})...`);

    // Check if branch already has assets to avoid duplicate sync (optional, but safer)
    const existingCount = await prisma.asset.count({ where: { clinicId: branch.id } });
    if (existingCount > 0) {
        console.log(`Branch already has ${existingCount} assets. Skipping to avoid duplicates.`);
        continue;
    }

    for (const asset of pusatAssets) {
      // Prepare new asset data
      const { id, createdAt, updatedAt, clinicId, ...assetData } = asset;
      
      // Update assetCode to use branch code
      const newAssetCode = asset.assetCode.replace('K001', branch.code);

      await prisma.asset.create({
        data: {
          ...assetData,
          assetCode: newAssetCode,
          clinicId: branch.id,
          // We keep the masterProductId reference if it exists
        }
      });
    }
    console.log(`Successfully synced ${pusatAssets.length} assets to ${branch.code}.`);
  }

  console.log('--- Synchronization Complete ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
