import { BranchService } from "../services/branch.service.js";
import { createBranchSchema, updateBranchSchema } from "../schemas/store.schema.js";
export class BranchController {
    static async createBranch(req, res, next) {
        try {
            const data = createBranchSchema.parse(req.body);
            const branch = await BranchService.createBranch(data);
            res.status(201).json(branch);
        }
        catch (error) {
            next(error);
        }
    }
    static async getBranch(req, res, next) {
        try {
            const branch = await BranchService.getBranchById(Number(req.params.id));
            res.status(200).json(branch);
        }
        catch (error) {
            next(error);
        }
    }
    static async getBranchesByStore(req, res, next) {
        try {
            const branches = await BranchService.getBranchesByStore(Number(req.params.storeId));
            res.status(200).json(branches);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateBranch(req, res, next) {
        try {
            const data = updateBranchSchema.parse(req.body);
            const branch = await BranchService.updateBranch(Number(req.params.id), data);
            res.status(200).json(branch);
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteBranch(req, res, next) {
        try {
            await BranchService.deleteBranch(Number(req.params.id));
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
}
