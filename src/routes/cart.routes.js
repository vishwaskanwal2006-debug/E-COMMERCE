import { Router } from "express";
import { getCart, updateCart } from "../controllers/cart.controllers.js";
import { auth_middleware } from "../middlewares/user_authentication.middleware.js";

const cart = Router();

cart.use(auth_middleware);
cart.route("/").get(getCart).post(updateCart);

export { cart };