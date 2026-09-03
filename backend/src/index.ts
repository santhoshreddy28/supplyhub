import customerRoutes from "./routes/customerRoutes";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sql } from "./config/database";
import authRoutes from "./routes/authRoutes";
import testRoutes from "./routes/testRoutes";
import productRoutes from "./routes/productRoutes";
import stockRoutes from "./routes/stockRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import challanRoutes from "./routes/challanRoutes";
import stockMovementRoutes from "./routes/stockMovementRoutes";
import invoiceRoutes from "./routes/invoiceRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/*
 * Vercel sends API requests as:
 * /api/auth/login
 * /api/products
 * /api/customers
 *
 * Remove the /api prefix before Express matches
 * the existing routes.
 */
app.use((req, res, next) => {
  if (req.url === "/api") {
    req.url = "/";
  } else if (req.url.startsWith("/api/")) {
    req.url = req.url.substring(4);
  }

  next();
});

app.use("/products", productRoutes);
app.use("/stock", stockRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/auth", authRoutes);
app.use("/test", testRoutes);
app.use("/customers", customerRoutes);
app.use("/challans", challanRoutes);
app.use("/stock-movements", stockMovementRoutes);
app.use("/invoices", invoiceRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "SupplyHub API is running",
  });
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await sql`SELECT NOW()`;

    res.json({
      message: "Database connected successfully",
      time: result[0].now,
    });
  } catch (error) {
    console.error(
      "Database connection error:",
      error
    );

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

export default app;
