import express from "express";

import {
  getDashboardStats
} from "../controllers/dashboardController";

import {
  authenticateToken,
  authorizeRoles
} from "../middleware/authMiddleware";

const router = express.Router();


/*
 * DASHBOARD
 *
 * Admin + Accounts + Sales + Warehouse
 */

router.get(
  "/",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "Accounts",
    "Sales",
    "Warehouse"
  ),
  getDashboardStats
);


export default router;