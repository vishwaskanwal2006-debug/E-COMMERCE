import { Router } from "express";
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from "../controllers/products.controllers.js";
import { auth_middleware } from "../middlewares/user_authentication.middleware.js";

const router = Router();

router.route("/").get(getProducts).post(auth_middleware, createProduct);
router.route("/:id").get(getProductById).put(auth_middleware, updateProduct).delete(auth_middleware, deleteProduct);

export { router as productsRouter };