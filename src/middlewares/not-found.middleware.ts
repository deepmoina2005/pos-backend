import { Request, Response, NextFunction } from "express";
import { ResourceNotFoundError } from "../exceptions/AppError.js";

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next(new ResourceNotFoundError("Route", req.originalUrl));
};
