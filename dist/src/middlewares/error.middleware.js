import { AppError } from "../exceptions/AppError.js";
import { ZodError } from "zod";
import fs from "fs";
// Equivalent to GlobalExceptionHandler @ControllerAdvice
export const errorHandler = (error, req, res, next) => {
    console.error(`[Error] ${error.message}`, error.stack);
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            message: error.message,
            status: error.statusCode,
        });
        return;
    }
    if (error instanceof ZodError) {
        res.status(400).json({
            message: "Validation failed",
            status: 400,
            errors: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }
    // Handle Prisma Known Request Errors
    if (error.name === "PrismaClientKnownRequestError") {
        const prismaError = error;
        if (prismaError.code === "P2002") {
            res.status(409).json({
                message: "Data integrity violation: Duplicate unique key",
                status: 409,
            });
            return;
        }
        if (prismaError.code === "P2003") {
            res.status(409).json({
                message: "Data integrity violation: Related records must be removed first",
                status: 409,
            });
            return;
        }
    }
    // Fallback generic error
    try {
        fs.writeFileSync("last_error.txt", error.stack || error.message);
    }
    catch (e) {
        console.error("Failed to write log", e);
    }
    res.status(500).json({
        message: error.message || "Internal Server Error",
        status: 500,
    });
};
