import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.post("/", CustomerController.createCustomer);
router.get("/", CustomerController.listCustomers);
router.get("/:id", CustomerController.getCustomer);
router.put("/:id", CustomerController.updateCustomer);
router.delete("/:id", CustomerController.deleteCustomer);

export default router;
