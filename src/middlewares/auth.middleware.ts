import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/security.util.js";
import { AccessDeniedException } from "../exceptions/AppError.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Replicates the OncePerRequestFilter JwtValidator logic
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  // "Bearer TOKEN"
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(new AccessDeniedException("Authentication token is missing"));
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return next(new AccessDeniedException("Invalid or expired token"));
  }
};

// Replicates the PreAuthorize or HTTP security filter
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AccessDeniedException("User not authenticated"));
    }

    const userRole = req.user.authorities.replace("ROLE_", "");
    
    if (!roles.includes(userRole)) {
      return next(
        new AccessDeniedException("You do not have permission to access this resource")
      );
    }
    
    next();
  };
};
