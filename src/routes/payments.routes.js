import { Router } from "express";
import { createPaymentIntent, verifyPayment } from "../controllers/payments.controllers.js";
import { auth_middleware } from "../middlewares/user_authentication.middleware.js";

const router = Router();

router.use(auth_middleware);
router.route("/create").post(createPaymentIntent);
router.route("/verify").post(verifyPayment);

export { router as paymentsRouter };