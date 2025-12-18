import { Router } from "express";
import { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, getStock, addStock } from "../controllers/warehouses.controllers.js";
import { auth_middleware } from "../middlewares/user_authentication.middleware.js";

const router = Router();

router.route("/").get(getWarehouses).post(auth_middleware, createWarehouse);
router.route("/:id").get(getWarehouse).put(auth_middleware, updateWarehouse);
router.route("/:wid/stock").get(getStock);
router.route("/:wid/stock/:pid").post(auth_middleware, addStock);

export { router as warehousesRouter };