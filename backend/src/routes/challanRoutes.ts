import express from "express";

import {
  getChallans,
  getChallanById,
  createChallan,
  confirmChallan
} from "../controllers/challanController";

import {
  authenticateToken
} from "../middleware/authMiddleware";

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  getChallans
);

router.get(
  "/:id",
  authenticateToken,
  getChallanById
);

router.post(
  "/",
  authenticateToken,
  createChallan
);

router.put(
  "/:id/confirm",
  authenticateToken,
  confirmChallan
);

export default router;