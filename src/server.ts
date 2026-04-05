import "dotenv/config";
import net from "node:net";
import app from "./app.js";
import { prisma } from "./lib/prisma.js";

const PORT = process.env.PORT || 5000;
const DB_STARTUP_RETRIES = Number(process.env.DB_STARTUP_RETRIES || 5);
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 3000);
const DB_HOST = process.env.DATABASE_HOST;
const DB_PORT = Number(process.env.DATABASE_PORT || 3306);

const checkTcpConnectivity = (host: string, port: number, timeoutMs = 5000) =>
  new Promise<void>((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve();
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish());
    socket.once("timeout", () => finish(new Error(`TCP timeout to ${host}:${port}`)));
    socket.once("error", (err) => finish(err as Error));
    socket.connect(port, host);
  });

// Only run the server listener if not in a serverless environment like Vercel
if (process.env.NODE_ENV !== "production") {
  const startServer = async () => {
    for (let attempt = 1; attempt <= DB_STARTUP_RETRIES; attempt++) {
      try {
        if (!DB_HOST) {
          throw new Error("DATABASE_HOST is missing");
        }

        await checkTcpConnectivity(DB_HOST, DB_PORT);

        // Initialize Prisma and execute lightweight ping to verify real DB access.
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        console.log("Connected to MySQL Database mapped by Prisma.");

        app.listen(PORT, () => {
          console.log(`Server running on port ${PORT}`);
        });
        return;
      } catch (error) {
        console.error(
          `Database connection failed (attempt ${attempt}/${DB_STARTUP_RETRIES}):`,
          error
        );

        await prisma.$disconnect().catch(() => undefined);

        if (attempt === DB_STARTUP_RETRIES) {
          process.exit(1);
        }

        await new Promise((resolve) => setTimeout(resolve, DB_RETRY_DELAY_MS));
      }
    }
  };

  startServer();
}

export default app;

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Prisma disconnected on app termination");
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  console.log("Prisma disconnected on app termination");
  process.exit(0);
});
