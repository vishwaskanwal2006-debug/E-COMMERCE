import { Router } from "express";
import { register, login, getMe, logout,registerAdmin } from "../controllers/auth.controllers.js";
import { auth_middleware } from "../middlewares/user_authentication.middleware.js";

const authRouter = Router();

// Public routes
authRouter.route("/register").post(register);
authRouter.route("/login").post(login);

// Protected routes (require auth-token header)
authRouter.route("/me").get(auth_middleware, getMe);
authRouter.route("/logout").post(auth_middleware, logout);
authRouter.route("/admin/register").post(registerAdmin);
export { authRouter };