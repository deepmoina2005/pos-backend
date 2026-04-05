import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import storeRoutes from "./routes/store.routes.js";
import branchRoutes from "./routes/branch.routes.js";
import productRoutes from "./routes/product.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import orderRoutes from "./routes/order.routes.js";
import shiftRoutes from "./routes/shift.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import refundRoutes from "./routes/refund.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import superAdminRoutes from "./routes/super-admin.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin (Electron main process, mobile apps, curl)
      if (!origin) return callback(null, true);

      const rawOrigins = [
        process.env.FRONTEND_URL,
      ]
        .filter(Boolean)
        .flatMap((value) => String(value).split(","))
        .map((value) => value.trim())
        .filter(Boolean);

      const allowedOrigins = new Set([
        ...rawOrigins,
        "app://-",
        "electron://-",
      ]);

      const isLocalhost = /^https?:\/\/localhost(?::\d+)?$/i.test(origin);
      const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
      const isCustomProtocol = 
        origin.startsWith("app://") || 
        origin.startsWith("electron://") || 
        origin.startsWith("file://");

      if (allowedOrigins.has(origin) || isLocalhost || isVercelPreview || isCustomProtocol || origin === "null") {
        return callback(null, true); // Reflect origin automatically
      }

      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());
app.use(morgan("dev"));

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({ status: "UP" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", userRoutes); // Alias for frontend compatibility
app.use("/api/stores", storeRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventories", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shift-reports", shiftRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/branch-analytics", analyticsRoutes);
app.use("/api/store/analytics", analyticsRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);

// Handle unhandled routes
app.use(notFoundHandler);

// Global Error Handler matches @ControllerAdvice
app.use(errorHandler);

export default app;
