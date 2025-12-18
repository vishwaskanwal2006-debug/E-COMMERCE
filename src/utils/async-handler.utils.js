import { api_error } from "./api-errors.utils.js"
const async_handler= (req_function)=>{
    return (req,res,next)=>{
        Promise.resolve(req_function(req,res,next))
        .catch(next)
    }
}
export default async_handler