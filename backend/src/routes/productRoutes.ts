import express from "express";

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getLowStockProducts
} from "../controllers/productController";

import {
  authenticateToken,
  authorizeRoles
} from "../middleware/authMiddleware";

const router = express.Router();


/*
 * GET ALL PRODUCTS
 *
 * Admin + Warehouse
 */

router.get(
  "/",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "Warehouse"
  ),
  getProducts
);


/*
 * LOW STOCK ALERTS
 *
 * Admin + Warehouse
 */

router.get(
  "/alerts/low-stock",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "Warehouse"
  ),
  getLowStockProducts
);


/*
 * GET SINGLE PRODUCT
 *
 * Admin + Warehouse
 */

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "Warehouse"
  ),
  getProductById
);


/*
 * CREATE PRODUCT
 *
 * Admin + Warehouse
 */

router.post(
  "/",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "Warehouse"
  ),
  createProduct
);


/*
 * UPDATE PRODUCT
 *
 * Admin + Warehouse
 */

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "Warehouse"
  ),
  updateProduct
);

export default router;