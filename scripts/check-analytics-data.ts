import { prisma } from "../src/lib/prisma.js";

async function checkData() {
  try {
    const storeCount = await prisma.store.count();
    const branchCount = await prisma.branch.count();
    const orderCount = await prisma.order.count();
    const userCount = await prisma.user.count();

    console.log({ storeCount, branchCount, orderCount, userCount });

    const firstStore = await prisma.store.findFirst({
        include: { admin: true }
    });
    console.log("First store:", firstStore);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { orderDate: 'desc' }
    });
    console.log("Recent orders count:", recentOrders.length);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
