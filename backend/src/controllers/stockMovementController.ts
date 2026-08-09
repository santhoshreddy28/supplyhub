import { Response } from "express";
import { sql } from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export const getStockMovements = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const movements = await sql`
      SELECT
        sm.id,
        sm.product_id,
        p.name AS product_name,
        p.sku,
        sm.quantity_changed,
        sm.movement_type,
        sm.reason,
        sm.created_by,
        u.name AS created_by_name,
        sm.created_at
      FROM stock_movements sm
      LEFT JOIN products p
        ON p.id = sm.product_id
      LEFT JOIN users u
        ON u.id = sm.created_by
      ORDER BY sm.created_at DESC
    `;

    return res.status(200).json({
      data: movements
    });
  } catch (error) {
    console.error(
      "Get stock movements error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch stock movements",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });
  }
};