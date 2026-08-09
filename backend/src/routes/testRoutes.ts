import { Router, Response } from "express";
import {
  authenticateToken,
  AuthRequest
} from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/roleMiddleware";

const router = Router();

router.get(
  "/admin",
  authenticateToken,
  authorizeRoles("Admin"),
  (req: AuthRequest, res: Response) => {
    res.json({
      message: "Welcome Admin",
      user: req.user
    });
  }
);

router.get(
  "/sales",
  authenticateToken,
  authorizeRoles("Sales"),
  (req: AuthRequest, res: Response) => {
    res.json({
      message: "Welcome Sales",
      user: req.user
    });
  }
);

export default router;