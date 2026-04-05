import { Request, Response, NextFunction } from "express";
import { CustomerService } from "../services/customer.service.js";
import { customerSchema, updateCustomerSchema } from "../schemas/customer.schema.js";

export class CustomerController {
  static async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = customerSchema.parse(req.body);
      const cashierId = req.user?.userId;
      const customer = await CustomerService.createCustomer(data, cashierId);
      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  }

  static async getCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.getCustomerById(Number(req.params.id));
      res.status(200).json(customer);
    } catch (error) {
      next(error);
    }
  }

  static async listCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      const userRole = req.user?.authorities?.replace("ROLE_", "");
      const cashierId = userRole === "BRANCH_CASHIER" ? req.user?.userId : undefined;

      const customers = await CustomerService.listCustomers(q as string, cashierId);
      res.status(200).json(customers);
    } catch (error) {
      next(error);
    }
  }

  static async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCustomerSchema.parse(req.body);
      const customer = await CustomerService.updateCustomer(Number(req.params.id), data);
      res.status(200).json(customer);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      await CustomerService.deleteCustomer(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
