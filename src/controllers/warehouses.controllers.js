import { api_response } from "../utils/api-response.utils.js";
import async_handler from "../utils/async-handler.utils.js";
import { api_error } from "../utils/api-errors.utils.js";

const getWarehouses = async_handler(async (req, res) => {
    const [rows] = await req.app.locals.database.execute("SELECT * FROM Warehouse");
    res.status(200).json(new api_response(200, { warehouses: rows }));
});

const getWarehouse = async_handler(async (req, res) => {
    const [rows] = await req.app.locals.database.execute("SELECT * FROM Warehouse WHERE WarehouseID = ?", [req.params.id]);
    if (rows.length === 0) throw new api_error(404, "Warehouse not found");
    res.status(200).json(new api_response(200, { warehouse: rows[0] }));
});

const createWarehouse = async_handler(async (req, res) => {
    if (!["Admin", "OfficeStaff"].includes(req.user.role)) throw new api_error(403, "Access denied");
    const { name, location } = req.body;
    await req.app.locals.database.execute("INSERT INTO Warehouse (Name, Location) VALUES (?, ?)", [name, location]);
    res.status(201).json(new api_response(201, { message: "Warehouse created" }));
});

const updateWarehouse = async_handler(async (req, res) => {
    if (!["Admin", "OfficeStaff"].includes(req.user.role)) throw new api_error(403, "Access denied");
    const { name, location } = req.body;
    await req.app.locals.database.execute("UPDATE Warehouse SET Name = ?, Location = ? WHERE WarehouseID = ?", [name, location, req.params.id]);
    res.status(200).json(new api_response(200, { message: "Warehouse updated" }));
});

const getStock = async_handler(async (req, res) => {
    const [rows] = await req.app.locals.database.execute(`
        SELECT s.*, p.Name, p.Image 
        FROM Stock s 
        JOIN Product p ON s.ProductID = p.ProductID 
        WHERE s.WarehouseID = ?
    `, [req.params.wid]);
    res.status(200).json(new api_response(200, { stock: rows }));
});

const addStock = async_handler(async (req, res) => {
    if (!["Admin", "OfficeStaff", "DeliveryStaff"].includes(req.user.role)) throw new api_error(403, "Access denied");
    const { quantity } = req.body;
    await req.app.locals.database.execute(`
        INSERT INTO Stock (WarehouseID, ProductID, Quantity) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE Quantity = Quantity + ?
    `, [req.params.wid, req.params.pid, quantity, quantity]);
    res.status(200).json(new api_response(200, { message: "Stock updated" }));
});

export { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, getStock, addStock };