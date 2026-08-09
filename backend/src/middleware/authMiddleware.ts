import {
  Request,
  Response,
  NextFunction
} from "express";

import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader =
    req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      message: "Access token is required"
    });
  }

  const token =
    authHeader.split(" ")[1];

  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      message: "JWT secret is not configured"
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as {
      userId: string;
      role: string;
    };

    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};


/*
 * ROLE AUTHORIZATION
 *
 * Usage:
 *
 * authorizeRoles("Admin")
 *
 * or:
 *
 * authorizeRoles(
 *   "Admin",
 *   "Warehouse"
 * )
 */

export const authorizeRoles = (
  ...allowedRoles: string[]
) => {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const userRole =
      req.user.role
        ?.trim()
        .toLowerCase();

    const hasPermission =
      allowedRoles.some(
        (role) =>
          role.trim().toLowerCase() ===
          userRole
      );

    if (!hasPermission) {
      return res.status(403).json({
        message: "Access denied",
        role: req.user.role
      });
    }

    next();
  };
};