import { Router } from "express";
import { getCategories } from "../controllers/categories.controllers.js";

const router = Router();

router.route("/").get(getCategories);

export { router as categoriesRouter };