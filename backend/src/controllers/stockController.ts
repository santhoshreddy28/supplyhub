import { Response } from "express";
import { sql } from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export const createStockMovement = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const {
      quantity,
      movement_type,
      reason
    } = req.body;

    if (
      !id ||
      !/^[0-9a-fA-F-]{36}$/.test(id)
    ) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const numericQuantity = Number(quantity);

    if (
      quantity === undefined ||
      !Number.isInteger(numericQuantity) ||
      numericQuantity <= 0
    ) {
      return res.status(400).json({
        message:
          "Quantity must be a positive integer"
      });
    }

    if (
      movement_type !== "IN" &&
      movement_type !== "OUT"
    ) {
      return res.status(400).json({
        message:
          "Movement type must be IN or OUT"
      });
    }

    const productResult = await sql`
      SELECT
        id,
        name,
        current_stock,
        min_stock_alert
      FROM products
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    if (productResult.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    const product = productResult[0];

    const stockChange =
      movement_type === "IN"
        ? numericQuantity
        : -numericQuantity;

    const currentStock =
      Number(product.current_stock);

    const newStock =
      currentStock + stockChange;

    if (newStock < 0) {
      return res.status(400).json({
        message: "Stock cannot go below zero",
        currentStock,
        requestedQuantity: numericQuantity
      });
    }

    const userId = req.user?.userId || null;

    const movementResult = await sql`
      INSERT INTO stock_movements (
        product_id,
        quantity_changed,
        movement_type,
        reason,
        created_by
      )
      VALUES (
        ${id}::uuid,
        ${stockChange},
        ${movement_type},
        ${reason || null},
        ${userId}
      )
      RETURNING
        id,
        product_id,
        quantity_changed,
        movement_type,
        reason,
        created_by,
        created_at
    `;

    const updatedProduct = await sql`
      UPDATE products
      SET
        current_stock = ${newStock},
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `;

    return res.status(201).json({
      message:
        movement_type === "IN"
          ? "Stock added successfully"
          : "Stock removed successfully",

      movement: movementResult[0],

      product: updatedProduct[0]
    });
  } catch (error: any) {
    console.error(
      "Stock movement error:",
      error
    );

    console.error(
      "Database error message:",
      error?.message
    );

    console.error(
      "Database error code:",
      error?.code
    );

    return res.status(500).json({
      message: "Failed to update stock",
      error:
        process.env.NODE_ENV === "development"
          ? error?.message
          : undefined
    });
  }
};

export const getStockMovements = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (
      !id ||
      !/^[0-9a-fA-F-]{36}$/.test(id)
    ) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const productResult = await sql`
      SELECT
        id,
        name,
        sku,
        current_stock
      FROM products
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    if (productResult.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    const movements = await sql`
      SELECT
        id,
        product_id,
        quantity_changed,
        movement_type,
        reason,
        created_by,
        created_at
      FROM stock_movements
      WHERE product_id = ${id}::uuid
      ORDER BY created_at DESC
    `;

    return res.json({
      product: productResult[0],
      movements
    });
  } catch (error: any) {
    console.error(
      "Get stock movements error:",
      error
    );

    console.error(
      "Database error message:",
      error?.message
    );

    console.error(
      "Database error code:",
      error?.code
    );

    return res.status(500).json({
      message:
        "Failed to fetch stock movements",
      error:
        process.env.NODE_ENV === "development"
          ? error?.message
          : undefined
    });
  }
};