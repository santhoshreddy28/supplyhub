import { Response } from "express";
import { sql } from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const productStats = await sql`
      SELECT
        COUNT(*)::int AS total_products,
        COALESCE(SUM(current_stock), 0)::int AS total_stock,
        COUNT(*) FILTER (
          WHERE current_stock > 0
          AND current_stock <= min_stock_alert
        )::int AS low_stock_products,
        COUNT(*) FILTER (
          WHERE current_stock = 0
        )::int AS out_of_stock_products,
        COALESCE(
          SUM(current_stock * unit_price),
          0
        )::numeric AS inventory_value
      FROM products
    `;

    const customerStats = await sql`
      SELECT
        COUNT(*)::int AS total_customers
      FROM customers
    `;

    const recentMovements = await sql`
      SELECT
        sm.id,
        sm.product_id,
        p.name AS product_name,
        p.sku,
        sm.quantity_changed,
        sm.movement_type,
        sm.reason,
        sm.created_at
      FROM stock_movements sm
      JOIN products p
        ON p.id = sm.product_id
      ORDER BY sm.created_at DESC
      LIMIT 10
    `;

    const lowStockProducts = await sql`
      SELECT
        id,
        name,
        sku,
        current_stock,
        min_stock_alert,
        location
      FROM products
      WHERE current_stock <= min_stock_alert
      ORDER BY current_stock ASC, name ASC
      LIMIT 10
    `;

    res.json({
      stats: {
        ...productStats[0],
        total_customers:
          customerStats[0].total_customers
      },
      recentMovements,
      lowStockProducts
    });
  } catch (error) {
    console.error(
      "Dashboard error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch dashboard data"
    });
  }
};