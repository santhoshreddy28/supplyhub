import express from "express";

import {
  createStockMovement,
  getStockMovements
} from "../controllers/stockController";

import {
  authenticateToken,
  authorizeRoles
} from "../middleware/authMiddleware";

const router = express.Router();


/*
 * CREATE STOCK MOVEMENT
 *
 * Admin + Warehouse
 */

router.post(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "Warehouse"
  ),
  createStockMovement
);


/*
 * GET STOCK HISTORY
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
  getStockMovements
);


export default router;