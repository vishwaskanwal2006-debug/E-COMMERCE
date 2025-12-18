import { api_response } from "../utils/api-response.utils.js";
import async_handler from "../utils/async-handler.utils.js";
const products=async_handler(async(req,res,next)=>{
const [rows] =await req.app.locals.database.execute("SELECT * FROM product");
res.status(200).json(new api_response(200,{data:rows,message:"products fetched sir"}));
}
)
/// /products/search?id&category
async function searching_filerting_of_products(req, res) {
  const prod_id = req.query.id;
  const category = req.query.category;

  try {
    const [rows] = await req.app.locals.database.execute(
      `SELECT * FROM product WHERE productid = ? AND category = ?`,
      [prod_id, category]
    );
   res.status(200).json(new api_response(200,{data:rows,message:"product searched"}));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export{products,searching_filerting_of_products}