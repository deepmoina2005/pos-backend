import { ZodError } from "zod";
export const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            const parsed = (await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            }));
            if (parsed.body)
                req.body = parsed.body;
            if (parsed.query)
                req.query = parsed.query;
            if (parsed.params)
                req.params = parsed.params;
            return next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    error: "Validation failed",
                    details: error.issues.map((issue) => ({
                        path: issue.path,
                        message: issue.message,
                    })),
                });
            }
            return res.status(500).json({ error: "Internal server error during validation" });
        }
    };
};
