import { api_response } from "../utils/api-response.utils.js";
import async_handler from "../utils/async-handler.utils.js";
import { api_error } from "../utils/api-errors.utils.js";

const createOrder = async_handler(async (req, res) => {
    if (req.user.role !== "Customer") throw new api_error(403, "Only customers can place orders");

    const [carts] = await req.app.locals.database.execute("SELECT CartID FROM Cart WHERE CustomerID = ?", [req.user.userId]);
    if (carts.length === 0) throw new api_error(400, "Cart is empty");

    const [items] = await req.app.locals.database.execute("SELECT * FROM CartItem WHERE CartID = ?", [carts[0].CartID]);
    if (items.length === 0) throw new api_error(400, "Cart is empty");

    const [result] = await req.app.locals.database.execute("INSERT INTO `Order` (CustomerID, Status) VALUES (?, 'pending')", [req.user.userId]);
    const orderId = result.insertId;

    let total = 0;
    for (const item of items) {
        const [p] = await req.app.locals.database.execute("SELECT Price FROM Product WHERE ProductID = ?", [item.ProductID]);
        total += p[0].Price * item.Quantity;
        await req.app.locals.database.execute("INSERT INTO OrderItem (OrderID, ProductID, Quantity, Price) VALUES (?, ?, ?, ?)", [orderId, item.ProductID, item.Quantity, p[0].Price]);
    }

    await req.app.locals.database.execute("UPDATE `Order` SET TotalAmount = ? WHERE OrderID = ?", [total, orderId]);
    await req.app.locals.database.execute("DELETE FROM CartItem WHERE CartID = ?", [carts[0].CartID]);

    res.status(201).json(new api_response(201, { orderId }));
});

const getMyOrders = async_handler(async (req, res) => {
    let query = req.user.role === "Customer" 
        ? "SELECT * FROM `Order` WHERE CustomerID = ?" 
        : "SELECT * FROM `Order`";
    const params = req.user.role === "Customer" ? [req.user.userId] : [];

    const [orders] = await req.app.locals.database.execute(query, params);
    res.status(200).json(new api_response(200, { orders }));
});

const getAllOrders = async_handler(async (req, res) => {
    if (!["Admin", "OfficeStaff", "DeliveryStaff"].includes(req.user.role)) throw new api_error(403, "Access denied");
    const [orders] = await req.app.locals.database.execute("SELECT * FROM `Order` ORDER BY CreatedAt DESC");
    res.status(200).json(new api_response(200, { orders }));
});

const getOrderById = async_handler(async (req, res) => {
    const [orders] = await req.app.locals.database.execute("SELECT * FROM `Order` WHERE OrderID = ?", [req.params.id]);
    if (orders.length === 0) throw new api_error(404, "Order not found");
    if (req.user.role === "Customer" && orders[0].CustomerID !== req.user.userId) throw new api_error(403, "Access denied");

    const [items] = await req.app.locals.database.execute("SELECT oi.*, p.Name FROM OrderItem oi JOIN Product p ON oi.ProductID = p.ProductID WHERE OrderID = ?", [req.params.id]);
    res.status(200).json(new api_response(200, { order: orders[0], items }));
});

const updateOrderStatus = async_handler(async (req, res) => {
    if (!["Admin", "OfficeStaff", "DeliveryStaff"].includes(req.user.role)) throw new api_error(403, "Access denied");
    const { status } = req.body;
    await req.app.locals.database.execute("UPDATE `Order` SET Status = ? WHERE OrderID = ?", [status, req.params.id]);
    res.status(200).json(new api_response(200, { message: "Status updated" }));
});

export { createOrder, getMyOrders, getAllOrders, getOrderById, updateOrderStatus };