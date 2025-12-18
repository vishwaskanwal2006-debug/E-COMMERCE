import { api_response } from "../utils/api-response.utils.js";
import async_handler from "../utils/async-handler.utils.js";
import { api_error } from "../utils/api-errors.utils.js";

const getProducts = async_handler(async (req, res) => {
    const q = req.query.q ? `%${req.query.q}%` : "%";
    const [rows] = await req.app.locals.database.execute(
        "SELECT * FROM Product WHERE Name LIKE ? OR Description LIKE ?", [q, q]
    );
    res.status(200).json(new api_response(200, { products: rows }));
});

const getProductById = async_handler(async (req, res) => {
    const [rows] = await req.app.locals.database.execute("SELECT * FROM Product WHERE ProductID = ?", [req.params.id]);
    if (rows.length === 0) throw new api_error(404, "Product not found");
    res.status(200).json(new api_response(200, { product: rows[0] }));
});

const createProduct = async_handler(async (req, res) => {
    if (!["Admin", "OfficeStaff"].includes(req.user.role)) throw new api_error(403, "Access denied");
    const { name, description, price, categoryId, image } = req.body;
    await req.app.locals.database.execute(
        "INSERT INTO Product (Name, Description, Price, CategoryID, Image) VALUES (?, ?, ?, ?, ?)",
        [name, description, price, categoryId, image]
    );
    res.status(201).json(new api_response(201, { message: "Product created" }));
});

const updateProduct = async_handler(async (req, res) => {
    if (!["Admin", "OfficeStaff"].includes(req.user.role)) throw new api_error(403, "Access denied");
    const { name, description, price, categoryId, image } = req.body;
    await req.app.locals.database.execute(
        "UPDATE Product SET Name=?, Description=?, Price=?, CategoryID=?, Image=? WHERE ProductID=?",
        [name, description, price, categoryId, image, req.params.id]
    );
    res.status(200).json(new api_response(200, { message: "Product updated" }));
});

const deleteProduct = async_handler(async (req, res) => {
    if (req.user.role !== "Admin") throw new api_error(403, "Access denied");
    await req.app.locals.database.execute("DELETE FROM Product WHERE ProductID = ?", [req.params.id]);
    res.status(200).json(new api_response(200, { message: "Product deleted" }));
});

export { getProducts, getProductById, createProduct, updateProduct, deleteProduct };