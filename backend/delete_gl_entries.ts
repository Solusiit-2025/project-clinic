import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Menghapus entri GL untuk 'Running Tex' dan 'Alat Laborator...'...");

  const entriesToDelete = await prisma.journalEntry.findMany({
    where: {
      OR: [
        { description: { contains: "Running Tex" } },
        { description: { contains: "Alat Laborator" } }
      ]
    },
    include: {
      details: true
    }
  });

  console.log(`Ditemukan ${entriesToDelete.length} entri jurnal.`);

  for (const entry of entriesToDelete) {
    console.log(`Menghapus entri: ${entry.description} (Tgl: ${entry.date})`);
    
    // We can just use the delete operation if cascade is set, or delete details first.
    // The details relation is `details`, so the table is likely `journalEntryDetail` or `journalDetail` or similar.
    // We can just use raw query to delete if we aren't sure of the exact model name, or we can use deleteMany on journalEntry if Cascade is on.
    
    try {
      await prisma.journalEntry.delete({
        where: { id: entry.id }
      });
      console.log(`✅ Berhasil dihapus (Cascade bekerja).`);
    } catch (e: any) {
      console.log(`Cascade gagal, mencoba menghapus manual...`);
      // Use raw SQL to delete details first
      await prisma.$executeRawUnsafe(`DELETE FROM journal_details WHERE "journalEntryId" = '${entry.id}'`);
      await prisma.$executeRawUnsafe(`DELETE FROM journal_entry_details WHERE "journalEntryId" = '${entry.id}'`);
      await prisma.journalEntry.delete({
        where: { id: entry.id }
      });
      console.log(`✅ Berhasil dihapus.`);
    }
  }

  console.log("Selesai menghapus data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
