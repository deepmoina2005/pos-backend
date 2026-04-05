import { Router } from "express";
import * as ExpenseController from "../controllers/expense.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

import { validateRequest } from "../middlewares/validate.middleware.js";
import { createExpenseSchema, updateExpenseSchema } from "../schemas/expense.schema.js";

const router = Router();

router.use(authenticateToken);

router.post("/", 
  authorizeRoles("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER", "BRANCH_CASHIER"), 
  validateRequest(createExpenseSchema),
  ExpenseController.createExpense
);
router.get("/", ExpenseController.getExpenses);
router.get("/stats", ExpenseController.getExpenseStats);
router.patch("/:id", 
  authorizeRoles("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER"), 
  validateRequest(updateExpenseSchema),
  ExpenseController.updateExpense
);
router.delete("/:id", authorizeRoles("ADMIN", "STORE_ADMIN", "BRANCH_MANAGER"), ExpenseController.deleteExpense);

export default router;
