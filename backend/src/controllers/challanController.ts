import { Response } from "express";
import { sql } from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export const getChallans = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const challans = await sql`
      SELECT
        c.id,
        c.challan_number,
        c.customer_id,
        cu.name AS customer_name,
        cu.business_name,
        c.total_quantity,
        c.status,
        c.created_by,
        u.name AS created_by_name,
        c.created_at
      FROM challans c
      LEFT JOIN customers cu
        ON cu.id = c.customer_id
      LEFT JOIN users u
        ON u.id = c.created_by
      ORDER BY c.created_at DESC
    `;

    return res.status(200).json(challans);
  } catch (error) {
    console.error("Get challans error:", error);

    return res.status(500).json({
      message: "Failed to fetch challans",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });
  }
};

export const getChallanById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const challanResult = await sql`
      SELECT
        c.id,
        c.challan_number,
        c.customer_id,
        cu.name AS customer_name,
        cu.business_name,
        c.total_quantity,
        c.status,
        c.created_by,
        u.name AS created_by_name,
        c.created_at
      FROM challans c
      LEFT JOIN customers cu
        ON cu.id = c.customer_id
      LEFT JOIN users u
        ON u.id = c.created_by
      WHERE c.id = ${id}
    `;

    if (challanResult.length === 0) {
      return res.status(404).json({
        message: "Challan not found"
      });
    }

    const items = await sql`
      SELECT
        id,
        product_id,
        product_name_snapshot,
        product_sku_snapshot,
        unit_price_snapshot,
        quantity
      FROM challan_items
      WHERE challan_id = ${id}
      ORDER BY id ASC
    `;

    return res.status(200).json({
      ...challanResult[0],
      items
    });
  } catch (error) {
    console.error("Get challan error:", error);

    return res.status(500).json({
      message: "Failed to fetch challan",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });
  }
};

export const createChallan = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      customerId,
      items
    } = req.body;

    if (!customerId) {
      return res.status(400).json({
        message: "Customer is required"
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "At least one product is required"
      });
    }

    for (const item of items) {
      if (!item.productId) {
        return res.status(400).json({
          message:
            "Product is required for every item"
        });
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return res.status(400).json({
          message:
            "Quantity must be a positive integer"
        });
      }
    }

    const customer = await sql`
      SELECT id
      FROM customers
      WHERE id = ${customerId}
    `;

    if (customer.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    const productIds = items.map(
      (item: { productId: string }) =>
        item.productId
    );

    const products = await sql`
      SELECT
        id,
        name,
        sku,
        unit_price,
        current_stock
      FROM products
      WHERE id = ANY(
        ${productIds}::uuid[]
      )
    `;

    if (
      products.length !==
      productIds.length
    ) {
      return res.status(404).json({
        message:
          "One or more products were not found"
      });
    }

    const productMap = new Map(
      products.map((product) => [
        product.id,
        product
      ])
    );

    let totalQuantity = 0;

    for (const item of items) {
      totalQuantity += item.quantity;
    }

    const challanNumberResult =
      await sql`
        SELECT
          'CH-' ||
          TO_CHAR(
            CURRENT_DATE,
            'YYYYMMDD'
          ) ||
          '-' ||
          LPAD(
            (
              COUNT(*) + 1
            )::text,
            4,
            '0'
          ) AS challan_number
        FROM challans
        WHERE DATE(created_at) =
          CURRENT_DATE
      `;

    const challanNumber =
      challanNumberResult[0]
        .challan_number;

    const challanResult = await sql`
      INSERT INTO challans (
        challan_number,
        customer_id,
        total_quantity,
        status,
        created_by
      )
      VALUES (
        ${challanNumber},
        ${customerId},
        ${totalQuantity},
        'Draft',
        ${req.user?.userId}
      )
      RETURNING *
    `;

    const challan =
      challanResult[0];

    for (const item of items) {
      const product =
        productMap.get(
          item.productId
        );

      if (!product) {
        return res.status(404).json({
          message:
            `Product not found: ${item.productId}`
        });
      }

      await sql`
        INSERT INTO challan_items (
          challan_id,
          product_id,
          product_name_snapshot,
          product_sku_snapshot,
          unit_price_snapshot,
          quantity
        )
        VALUES (
          ${challan.id},
          ${item.productId},
          ${product.name},
          ${product.sku},
          ${product.unit_price},
          ${item.quantity}
        )
      `;
    }

    return res.status(201).json({
      message:
        "Challan created successfully",
      challanId: challan.id,
      challanNumber:
        challan.challan_number
    });

  } catch (error) {
    console.error(
      "Create challan error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create challan",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });
  }
};

export const confirmChallan = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    /*
     * 1. Get the challan
     */

    const challanResult = await sql`
      SELECT
        id,
        challan_number,
        status,
        created_by
      FROM challans
      WHERE id = ${id}
    `;

    if (challanResult.length === 0) {
      return res.status(404).json({
        message: "Challan not found"
      });
    }

    const challan =
      challanResult[0];

    /*
     * 2. Make sure it is still Draft
     */

    if (challan.status !== "Draft") {
      return res.status(400).json({
        message:
          "Only draft challans can be confirmed"
      });
    }

    /*
     * 3. Get challan items with
     *    current product stock
     */

    const items = await sql`
      SELECT
        ci.product_id,
        ci.quantity,
        ci.product_name_snapshot,
        p.current_stock
      FROM challan_items ci
      JOIN products p
        ON p.id = ci.product_id
      WHERE ci.challan_id = ${id}
    `;

    if (items.length === 0) {
      return res.status(400).json({
        message:
          "Challan has no products"
      });
    }

    /*
     * 4. Check stock BEFORE
     *    changing anything
     */

    for (const item of items) {
      if (
        Number(item.current_stock) <
        Number(item.quantity)
      ) {
        return res.status(400).json({
          message:
            `Insufficient stock for ${item.product_name_snapshot}. ` +
            `Available: ${item.current_stock}, ` +
            `Required: ${item.quantity}`
        });
      }
    }

    /*
     * 5. Deduct stock
     */

    for (const item of items) {
      await sql`
        UPDATE products
        SET
          current_stock =
            current_stock -
            ${item.quantity},
          updated_at = NOW()
        WHERE id = ${item.product_id}
      `;
    }

    /*
     * 6. Create stock movements
     *
     * IMPORTANT:
     * Database column is
     * quantity_changed
     */

    for (const item of items) {
      await sql`
        INSERT INTO stock_movements (
          product_id,
          quantity_changed,
          movement_type,
          reason,
          created_by
        )
        VALUES (
          ${item.product_id},
          ${item.quantity},
          'OUT',
          ${`Sales Challan ${challan.challan_number}`},
          ${req.user?.userId}
        )
      `;
    }

    /*
     * 7. Mark challan Confirmed
     */

    const updatedChallan =
      await sql`
        UPDATE challans
        SET
          status = 'Confirmed'
        WHERE id = ${id}
        RETURNING *
      `;

    return res.status(200).json({
      message:
        "Challan confirmed successfully",
      challan:
        updatedChallan[0]
    });

  } catch (error) {
    console.error(
      "Confirm challan error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to confirm challan",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });
  }
};