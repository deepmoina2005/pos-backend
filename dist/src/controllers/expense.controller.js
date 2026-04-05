import { ExpenseService } from "../services/expense.service.js";
export const createExpense = async (req, res) => {
    try {
        const expense = await ExpenseService.createExpense(req.body);
        res.status(201).json(expense);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export const getExpenses = async (req, res) => {
    try {
        const branchIdStr = req.query.branchId;
        const branchId = parseInt(branchIdStr);
        if (!branchId)
            throw new Error("Branch ID is required");
        const expenses = await ExpenseService.getExpensesByBranch(branchId);
        res.status(200).json(expenses);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export const getExpenseStats = async (req, res) => {
    try {
        const branchIdStr = req.query.branchId;
        const branchId = parseInt(branchIdStr);
        if (!branchId)
            throw new Error("Branch ID is required");
        const stats = await ExpenseService.getBranchExpenseStats(branchId);
        res.status(200).json(stats);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export const updateExpense = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const expense = await ExpenseService.updateExpense(id, req.body);
        res.status(200).json(expense);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export const deleteExpense = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await ExpenseService.deleteExpense(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
