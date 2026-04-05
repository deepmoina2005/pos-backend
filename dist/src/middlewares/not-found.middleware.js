import { ResourceNotFoundError } from "../exceptions/AppError.js";
export const notFoundHandler = (req, res, next) => {
    next(new ResourceNotFoundError("Route", req.originalUrl));
};
