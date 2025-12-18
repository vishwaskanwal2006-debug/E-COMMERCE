import { Router } from "express";
import { getSuppliers } from "../controllers/suppliers.controllers.js";
import { auth_middleware } from "../middlewares/user_authentication.middleware.js";

const router = Router();

router.route("/").get(auth_middleware, getSuppliers);

export { router as suppliersRouter };