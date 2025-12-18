import { api_error } from "../utils/api-errors.utils.js";
import async_handler from "../utils/async-handler.utils.js";

const auth_middleware = async_handler(async (req, res, next) => {
    const token = req.headers["auth-token"];
    if (!token) throw new api_error(401, "No auth token provided");

    let user = null;

    // Check Customer
    let [rows] = await req.app.locals.database.execute(
        "SELECT CustomerID AS userId FROM Customer WHERE AuthToken = ?",
        [token]
    );
    if (rows.length > 0) {
        user = { userId: rows[0].userId, role: "Customer" };
    }

    // Check Supplier
    if (!user) {
        [rows] = await req.app.locals.database.execute(
            "SELECT SupplierID AS userId FROM Supplier WHERE AuthToken = ?",
            [token]
        );
        if (rows.length > 0) user = { userId: rows[0].userId, role: "Supplier" };
    }

    // Check Employee
    if (!user) {
        [rows] = await req.app.locals.database.execute(
            "SELECT EmpID AS userId, Role FROM Employee WHERE AuthToken = ?",
            [token]
        );
        if (rows.length > 0) user = { userId: rows[0].userId, role: rows[0].Role };
    }

    if (!user) throw new api_error(401, "Invalid or expired token");

    req.user = user;
    next();
});

export { auth_middleware };