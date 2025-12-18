import { Router } from "express";
import { getAllCustomers, getAllEmployees } from "../controllers/admin.controllers.js";
import { auth_middleware } from "../middlewares/user_authentication.middleware.js";

const router = Router();

router.use(auth_middleware);
router.route("/customers").get(getAllCustomers);
router.route("/employees").get(getAllEmployees);

export { router as adminRouter };