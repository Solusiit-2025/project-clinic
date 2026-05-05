import { prisma } from '../lib/prisma';

async function main() {
  const invoiceNo = 'INV-20260505-0002';
  const inv = await prisma.invoice.findUnique({
    where: { invoiceNo },
    include: { payments: true }
  });

  if (!inv) {
    console.log('Invoice not found');
    return;
  }

  const subtotal = inv.subtotal;
  const amountPaid = inv.amountPaid;
  const discountNeeded = subtotal - amountPaid;

  console.log(`Fixing Invoice ${invoiceNo}:`);
  console.log(`Subtotal: ${subtotal}, Paid: ${amountPaid}, Discount Needed: ${discountNeeded}`);

  const updated = await prisma.invoice.update({
    where: { id: inv.id },
    data: {
      discount: discountNeeded,
      total: amountPaid,
      status: 'paid'
    }
  });

  console.log('Update result:', JSON.stringify(updated, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
