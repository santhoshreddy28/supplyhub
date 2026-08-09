import { Router } from "express";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
  getCustomerById,
  addFollowUp,
  getFollowUps
} from "../controllers/customerController";

import {
  authenticateToken,
  authorizeRoles
} from "../middleware/authMiddleware";

const router = Router();


/*
 * GET ALL CUSTOMERS
 *
 * Admin + Accounts + Sales
 */

router.get(
  "/",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "Accounts",
    "Sales"
  ),
  getCustomers
);


/*
 * CREATE CUSTOMER
 *
 * Admin + Accounts + Sales
 */

router.post(
  "/",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "Accounts",
    "Sales"
  ),
  createCustomer
);


/*
 * GET SINGLE CUSTOMER
 *
 * Admin + Accounts + Sales
 */

router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "Accounts",
    "Sales"
  ),
  getCustomerById
);


/*
 * UPDATE CUSTOMER
 *
 * Admin + Accounts + Sales
 */

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "Accounts",
    "Sales"
  ),
  updateCustomer
);


/*
 * ADD FOLLOW-UP
 *
 * Admin + Accounts + Sales
 */

router.post(
  "/:id/follow-ups",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "Accounts",
    "Sales"
  ),
  addFollowUp
);


/*
 * GET FOLLOW-UPS
 *
 * Admin + Accounts + Sales
 */

router.get(
  "/:id/follow-ups",
  authenticateToken,
  authorizeRoles(
    "Admin",
    "Accounts",
    "Sales"
  ),
  getFollowUps
);


export default router;