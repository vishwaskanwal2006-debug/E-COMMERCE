import { api_response } from "../utils/api-response.utils.js";
import async_handler from "../utils/async-handler.utils.js";
// /user/:id   /user/123
 const user_details=async_handler(async(req,res,next)=>{
    const user_id= req.params.id;
    const [rows] = await req.app.locals.database.execute(
        'SELECT * FROM customer WHERE customerid = ?',
        [user_id]
    );
    res.status(200).json(new api_response(200,{data:rows,message:"usr details fetched"}));

})


export {user_details};
