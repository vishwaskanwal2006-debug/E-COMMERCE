import { api_response } from "../utils/api-response.utils.js";
import async_handler from "../utils/async-handler.utils.js";
import { api_error } from "../utils/api-errors.utils.js";

const getAllCustomers = async_handler(async (req, res) => {
    if (!["Admin", "OfficeStaff"].includes(req.user.role)) throw new api_error(403, "Access denied");
    const [rows] = await req.app.locals.database.execute("SELECT CustomerID, Name, Email, ContactNumber, Address, CreatedAt FROM Customer");
    res.status(200).json(new api_response(200, { customers: rows }));
});

const getAllEmployees = async_handler(async (req, res) => {
    if (req.user.role !== "Admin") throw new api_error(403, "Access denied");
    const [rows] = await req.app.locals.database.execute("SELECT EmpID, Name, Email, Role, Designation, JoiningDate FROM Employee");
    res.status(200).json(new api_response(200, { employees: rows }));
});

export { getAllCustomers, getAllEmployees };