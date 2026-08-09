import { Router } from "express";

import {
  getInvoices,
  getInvoiceById,
  createInvoiceFromChallan
} from "../controllers/invoiceController";

import {
  authenticateToken
} from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/",
  authenticateToken,
  getInvoices
);

router.get(
  "/:id",
  authenticateToken,
  getInvoiceById
);

router.post(
  "/from-challan/:challanId",
  authenticateToken,
  createInvoiceFromChallan
);

export default router;