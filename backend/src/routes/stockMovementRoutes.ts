import { Router } from "express";

import {
  getStockMovements
} from "../controllers/stockMovementController";

import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/",
  authenticateToken,
  getStockMovements
);

export default router;