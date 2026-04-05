import { Request, Response } from "express";
import { ExpenseService } from "../services/expense.service.js";

export const createExpense = async (req: Request, res: Response) => {
  try {
    const expense = await ExpenseService.createExpense(req.body);
    res.status(201).json(expense);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const branchIdStr = req.query.branchId as string;
    const branchId = parseInt(branchIdStr);
    if (!branchId) throw new Error("Branch ID is required");
    const expenses = await ExpenseService.getExpensesByBranch(branchId);
    res.status(200).json(expenses);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getExpenseStats = async (req: Request, res: Response) => {
  try {
    const branchIdStr = req.query.branchId as string;
    const branchId = parseInt(branchIdStr);
    if (!branchId) throw new Error("Branch ID is required");
    const stats = await ExpenseService.getBranchExpenseStats(branchId);
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const expense = await ExpenseService.updateExpense(id, req.body);
    res.status(200).json(expense);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await ExpenseService.deleteExpense(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
