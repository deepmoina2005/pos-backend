import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/utils/security.util.js";
import { BillingCycle, UserRole } from "../src/generated/client/index.js";
import "dotenv/config";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || "admin@pos.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "123456";

  console.log("Seeding data...");

  const existing = await prisma.user.findUnique({ where: { email } });
  const hashedPassword = await hashPassword(password);

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: "Super Admin",
        role: UserRole.SUPER_ADMIN
      }
    });
    console.log("Super Admin created");
  } else {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    console.log("Existing user role:", existingUser?.role);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, role: UserRole.SUPER_ADMIN }
    });
    
    const updatedUser = await prisma.user.findUnique({ where: { email } });
    console.log("Updated user role:", updatedUser?.role);
    console.log("Super Admin updated");
  }

  // Create Demo User
  const demoEmail = "demo@pospro.com";
  const demoPassword = await hashPassword("demo123");
  const existingDemo = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!existingDemo) {
    await prisma.user.create({
      data: {
        email: demoEmail,
        password: demoPassword,
        fullName: "Demo User",
        role: UserRole.STORE_ADMIN
      }
    });
    console.log("Demo User created");
  }

  try {
    // Clear existing data
    await prisma.subscription.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    console.log("Old subscription data cleared");

    // Seed Subscription Plans
    const plans = [
      {
        name: "Starter",
        description: "Ideal for small kiosks and single counters.",
        price: 499,
        billingCycle: BillingCycle.MONTHLY,
        maxBranches: 1,
        maxEmployees: 2,
        maxProducts: 50,
        features: JSON.stringify({
          enableInventory: true,
          enableAdvancedReports: false,
          prioritySupport: false
        })
      },
      {
        name: "Business",
        description: "Best for growing stores with multiple staff.",
        price: 1499,
        billingCycle: BillingCycle.MONTHLY,
        maxBranches: 2,
        maxEmployees: 10,
        maxProducts: 500,
        features: JSON.stringify({
          enableInventory: true,
          enableAdvancedReports: true,
          enableInvoiceBranding: true,
          prioritySupport: false
        })
      },
      {
        name: "Enterprise",
        description: "Unlimited power for large retail chains.",
        price: 4999,
        billingCycle: BillingCycle.MONTHLY,
        maxBranches: 10,
        maxEmployees: 50,
        maxProducts: 5000,
        features: JSON.stringify({
          enableInventory: true,
          enableAdvancedReports: true,
          enableMultiLocation: true,
          enableEcommerce: true,
          prioritySupport: true
        })
      }
    ];

    for (const plan of plans) {
      console.log(`Creating plan: ${plan.name}`);
      await prisma.subscriptionPlan.create({
        data: plan
      });
    }

    console.log("Subscription plans seeded successfully");
  } catch (err: any) {
    console.error("DETAILED SEED ERROR:");
    console.error("Message:", err.message);
    console.error("Code:", err.code);
    console.error("Meta:", JSON.stringify(err.meta));
    throw err;
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    process.exit(1);
  });