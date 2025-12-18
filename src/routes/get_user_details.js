import{Router}from "express"
import { user_details } from "../controllers/get_user_details.js";
const userroute=Router();
userroute.route("/:id").get(user_details)
export default userroute
