import { Router } from "express";
import { createOrder, getMyOrders, getAllOrders, getOrderById, updateOrderStatus } from "../controllers/orders.controllers.js";
import { auth_middleware } from "../middlewares/user_authentication.middleware.js";

const router = Router();

router.use(auth_middleware);

router.route("/").post(createOrder).get(getMyOrders);
router.route("/all").get(getAllOrders);
router.route("/:id").get(getOrderById);
router.route("/:id/status").put(updateOrderStatus);

export { router as ordersRouter };