import { Request, Response, NextFunction } from "express";
import { SubscriptionService } from "../services/subscription.service.js";
import { createSubscriptionSchema } from "../schemas/subscription.schema.js";

export class SubscriptionController {
  static async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = Number(req.query.storeId);
      const planId = Number(req.query.planId);
      const gateway = (req.query.gateway as string) || "RAZORPAY";
      const result = await SubscriptionService.subscribeToPlan(storeId, planId, gateway);
      res.status(201).json(result);
    } catch (error) {
       next(error);
    }
  }

  static async upgrade(req: Request, res: Response, next: NextFunction) {
    try {
      const storeId = Number(req.query.storeId);
      const planId = Number(req.query.planId);
      const gateway = (req.query.gateway as string) || "RAZORPAY";
      const result = await SubscriptionService.upgradeSubscription(storeId, planId, gateway);
      res.status(200).json(result);
    } catch (error) {
       next(error);
    }
  }

  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await SubscriptionService.activateSubscription(Number(req.params.subscriptionId));
      res.status(200).json(sub);
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await SubscriptionService.cancelSubscription(Number(req.params.subscriptionId));
      res.status(200).json(sub);
    } catch (error) {
      next(error);
    }
  }

  static async updatePaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string;
      const sub = await SubscriptionService.updatePaymentStatus(Number(req.params.subscriptionId), status);
      res.status(200).json(sub);
    } catch (error) {
      next(error);
    }
  }

  static async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const sub = await SubscriptionService.getStoreSubscription(Number(req.params.storeId));
      res.status(200).json(sub);
    } catch (error) {
      next(error);
    }
  }

  static async listSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string;
      const subs = await SubscriptionService.getAllSubscriptions(status);
      res.status(200).json(subs);
    } catch (error) {
       next(error);
    }
  }

  static async getExpiring(req: Request, res: Response, next: NextFunction) {
    try {
      const days = Number(req.query.days || 7);
      const subs = await SubscriptionService.getExpiringSubscriptions(days);
      res.status(200).json(subs);
    } catch (error) {
      next(error);
    }
  }

  static async countByStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string;
      const count = await SubscriptionService.countByStatus(status);
      res.status(200).json({ count });
    } catch (error) {
      next(error);
    }
  }

  static async checkStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await SubscriptionService.checkStatus(Number(req.params.storeId));
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }
}
