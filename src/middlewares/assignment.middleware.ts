import { Request, Response, NextFunction } from "express";
import { AccessDeniedException } from "../exceptions/AppError.js";
import { ensureActiveAssignment } from "../utils/assignment.util.js";

export const requireActiveAssignment = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = ensureActiveAssignment(req.user);
  if (!result.ok) {
    return next(new AccessDeniedException(result.message));
  }
  next();
};

