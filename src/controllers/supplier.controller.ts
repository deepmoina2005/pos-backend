import { Request, Response } from "express";
import { SupplierService } from "../services/supplier.service.js";

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const supplier = await SupplierService.createSupplier(req.body);
    res.status(201).json(supplier);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const storeId = parseInt(req.query.storeId as string);
    if (!storeId) throw new Error("Store ID is required");
    const suppliers = await SupplierService.getSuppliersByStore(storeId);
    res.status(200).json(suppliers);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const supplier = await SupplierService.updateSupplier(id, req.body);
    res.status(200).json(supplier);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    await SupplierService.deleteSupplier(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
