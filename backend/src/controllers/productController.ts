import { Response } from "express";
import { sql } from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export const getProducts = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const search = String(
      req.query.search || ""
    ).trim();

    const category = String(
      req.query.category || ""
    ).trim();

    const offset = (page - 1) * limit;

    const products = await sql`
      SELECT
        id,
        name,
        sku,
        category,
        unit_price,
        current_stock,
        min_stock_alert,
        location,
        created_by,
        created_at,
        updated_at
      FROM products
      WHERE
        (
          name ILIKE ${`%${search}%`}
          OR sku ILIKE ${`%${search}%`}
          OR COALESCE(category, '') ILIKE ${`%${search}%`}
        )
        AND (
          ${category} = ''
          OR category = ${category}
        )
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countResult = await sql`
      SELECT COUNT(*)::int AS total
      FROM products
      WHERE
        (
          name ILIKE ${`%${search}%`}
          OR sku ILIKE ${`%${search}%`}
          OR COALESCE(category, '') ILIKE ${`%${search}%`}
        )
        AND (
          ${category} = ''
          OR category = ${category}
        )
    `;

    const total = countResult[0].total;

    res.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(
      "Get products error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch products"
    });
  }
};

export const getProductById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const result = await sql`
      SELECT
        id,
        name,
        sku,
        category,
        unit_price,
        current_stock,
        min_stock_alert,
        location,
        created_by,
        created_at,
        updated_at
      FROM products
      WHERE id = ${id}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json({
      product: result[0]
    });
  } catch (error) {
    console.error(
      "Get product error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch product"
    });
  }
};

export const createProduct = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      name,
      sku,
      category,
      unit_price,
      current_stock,
      min_stock_alert,
      location
    } = req.body;

    if (
      !name ||
      !String(name).trim() ||
      !sku ||
      !String(sku).trim() ||
      unit_price === undefined
    ) {
      return res.status(400).json({
        message:
          "Name, SKU and unit price are required"
      });
    }

    const price = Number(unit_price);

    if (
      Number.isNaN(price) ||
      price < 0
    ) {
      return res.status(400).json({
        message:
          "Unit price must be a valid non-negative number"
      });
    }

    const initialStock =
      current_stock === undefined
        ? 0
        : Number(current_stock);

    if (
      Number.isNaN(initialStock) ||
      !Number.isInteger(initialStock) ||
      initialStock < 0
    ) {
      return res.status(400).json({
        message:
          "Current stock must be a non-negative integer"
      });
    }

    const minimumStock =
      min_stock_alert === undefined
        ? 0
        : Number(min_stock_alert);

    if (
      Number.isNaN(minimumStock) ||
      !Number.isInteger(minimumStock) ||
      minimumStock < 0
    ) {
      return res.status(400).json({
        message:
          "Minimum stock alert must be a non-negative integer"
      });
    }

    const existingProduct = await sql`
      SELECT id
      FROM products
      WHERE sku = ${String(sku).trim()}
      LIMIT 1
    `;

    if (existingProduct.length > 0) {
      return res.status(409).json({
        message: "A product with this SKU already exists"
      });
    }

    const result = await sql`
      INSERT INTO products (
        name,
        sku,
        category,
        unit_price,
        current_stock,
        min_stock_alert,
        location,
        created_by
      )
      VALUES (
        ${String(name).trim()},
        ${String(sku).trim()},
        ${category || null},
        ${price},
        ${initialStock},
        ${minimumStock},
        ${location || null},
        ${req.user?.userId || null}
      )
      RETURNING *
    `;

    res.status(201).json({
      message: "Product created successfully",
      product: result[0]
    });
  } catch (error) {
    console.error(
      "Create product error:",
      error
    );

    res.status(500).json({
      message: "Failed to create product"
    });
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const {
      name,
      sku,
      category,
      unit_price,
      min_stock_alert,
      location
    } = req.body;

    const existingProduct = await sql`
      SELECT *
      FROM products
      WHERE id = ${id}
      LIMIT 1
    `;

    if (existingProduct.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    const current = existingProduct[0];

    const updatedName =
      name === undefined
        ? current.name
        : String(name).trim();

    const updatedSku =
      sku === undefined
        ? current.sku
        : String(sku).trim();

    const updatedCategory =
      category === undefined
        ? current.category
        : category || null;

    const updatedPrice =
      unit_price === undefined
        ? Number(current.unit_price)
        : Number(unit_price);

    const updatedMinimumStock =
      min_stock_alert === undefined
        ? Number(current.min_stock_alert)
        : Number(min_stock_alert);

    const updatedLocation =
      location === undefined
        ? current.location
        : location || null;

    if (!updatedName) {
      return res.status(400).json({
        message: "Product name is required"
      });
    }

    if (!updatedSku) {
      return res.status(400).json({
        message: "SKU is required"
      });
    }

    if (
      Number.isNaN(updatedPrice) ||
      updatedPrice < 0
    ) {
      return res.status(400).json({
        message:
          "Unit price must be a valid non-negative number"
      });
    }

    if (
      Number.isNaN(updatedMinimumStock) ||
      !Number.isInteger(updatedMinimumStock) ||
      updatedMinimumStock < 0
    ) {
      return res.status(400).json({
        message:
          "Minimum stock alert must be a non-negative integer"
      });
    }

    const duplicateSku = await sql`
      SELECT id
      FROM products
      WHERE sku = ${updatedSku}
        AND id <> ${id}
      LIMIT 1
    `;

    if (duplicateSku.length > 0) {
      return res.status(409).json({
        message:
          "Another product already uses this SKU"
      });
    }

    const result = await sql`
      UPDATE products
      SET
        name = ${updatedName},
        sku = ${updatedSku},
        category = ${updatedCategory},
        unit_price = ${updatedPrice},
        min_stock_alert = ${updatedMinimumStock},
        location = ${updatedLocation},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    res.json({
      message: "Product updated successfully",
      product: result[0]
    });
  } catch (error) {
    console.error(
      "Update product error:",
      error
    );

    res.status(500).json({
      message: "Failed to update product"
    });
  }
};

export const getLowStockProducts = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const products = await sql`
      SELECT
        id,
        name,
        sku,
        category,
        current_stock,
        min_stock_alert,
        location
      FROM products
      WHERE current_stock <= min_stock_alert
      ORDER BY current_stock ASC, name ASC
    `;

    res.json({
      data: products,
      total: products.length
    });
  } catch (error) {
    console.error(
      "Low stock products error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch low stock products"
    });
  }
};