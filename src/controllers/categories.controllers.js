import { api_response } from "../utils/api-response.utils.js";
import async_handler from "../utils/async-handler.utils.js";

const getCategories = async_handler(async (req, res) => {
    const [rows] = await req.app.locals.database.execute("SELECT * FROM Category");
    res.status(200).json(new api_response(200, { categories: rows }));
});

export { getCategories };