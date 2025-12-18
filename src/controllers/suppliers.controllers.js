import { api_response } from "../utils/api-response.utils.js";
import async_handler from "../utils/async-handler.utils.js";

const getSuppliers = async_handler(async (req, res) => {
    const [rows] = await req.app.locals.database.execute("SELECT SupplierID, Name, ContactEmail AS Email, Address FROM Supplier");
    res.status(200).json(new api_response(200, { suppliers: rows }));
});

export { getSuppliers };