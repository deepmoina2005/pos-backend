import { SupplierService } from "../services/supplier.service.js";
export const createSupplier = async (req, res) => {
    try {
        const supplier = await SupplierService.createSupplier(req.body);
        res.status(201).json(supplier);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export const getSuppliers = async (req, res) => {
    try {
        const storeId = parseInt(req.query.storeId);
        if (!storeId)
            throw new Error("Store ID is required");
        const suppliers = await SupplierService.getSuppliersByStore(storeId);
        res.status(200).json(suppliers);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export const updateSupplier = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const supplier = await SupplierService.updateSupplier(id, req.body);
        res.status(200).json(supplier);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export const deleteSupplier = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await SupplierService.deleteSupplier(id);
        res.status(204).send();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
