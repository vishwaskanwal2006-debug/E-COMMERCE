import {Router} from "express"
import { healthcheck } from "../controllers/healthcheck.controller.js"
const rout=Router();
rout.route("/").get(healthcheck);
export {rout}