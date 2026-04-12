import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
  console.log('Testing Category Deletion Safety Lock...');
  
  // 1. Find a category that has products (we know 'Obat-obatan' is one from the seed)
  const category = await prisma.productCategory.findUnique({
    where: { categoryName: 'Medicine' }
  });

  if (!category) {
    console.error('Target category not found');
    return;
  }

  console.log(`Attempting to delete category: ${category.categoryName} (${category.id})`);
  
  // We'll simulate the controller's logic
  const productCount = await prisma.productMaster.count({
    where: { categoryId: category.id }
  });

  if (productCount > 0) {
    console.log(`✅ Success: Found ${productCount} products. Deletion BLOCKED by manual check.`);
  } else {
    console.warn('⚠️ No products found for this category. Seed might not have run correctly.');
  }

  // Double check DB-level protection (Restricted)
  try {
    await prisma.productCategory.delete({ where: { id: category.id } });
    console.error('❌ FAILURE: Category was deleted despite having products! DB-level constraint failed.');
  } catch (e: any) {
    if (e.code === 'P2003' || e.message.includes('Foreign key constraint')) {
      console.log('✅ Success: DB-level RESTRICT constraint protected the data.');
    } else {
      console.error('Unexpected error:', e);
    }
  }
}

verify().finally(() => prisma.$disconnect());
