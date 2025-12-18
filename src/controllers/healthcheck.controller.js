import { api_response } from "../utils/api-response.utils.js";
import async_handler from "../utils/async-handler.utils.js";
const healthcheck = async_handler(async (req,res,next) =>{
    res.status(200).json(new api_response(200,{message:"server running "}));
})

export {healthcheck};

    
