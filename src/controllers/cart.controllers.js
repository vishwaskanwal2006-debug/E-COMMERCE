import { api_response } from "../utils/api-response.utils.js";
import async_handler from "../utils/async-handler.utils.js";

const getCart = async_handler(async (req, res) => {
    if (req.user.role !== "Customer") return res.status(403).json(new api_response(403, null, "Access denied"));

    const [carts] = await req.app.locals.database.execute("SELECT CartID FROM Cart WHERE CustomerID = ?", [req.user.userId]);
    if (carts.length === 0) return res.status(200).json(new api_response(200, { items: [] }));

    const [items] = await req.app.locals.database.execute(`
        SELECT ci.*, p.Name, p.Price, p.Image 
        FROM CartItem ci 
        JOIN Product p ON ci.ProductID = p.ProductID 
        WHERE ci.CartID = ?
    `, [carts[0].CartID]);

    res.status(200).json(new api_response(200, { items }));
});

const updateCart = async_handler(async (req, res) => {
    if (req.user.role !== "Customer") return res.status(403).json(new api_response(403, null, "Access denied"));

    const { productId, quantity } = req.body;
    const [carts] = await req.app.locals.database.execute("SELECT CartID FROM Cart WHERE CustomerID = ?", [req.user.userId]);

    let cartId;
    if (carts.length === 0) {
        const [result] = await req.app.locals.database.execute("INSERT INTO Cart (CustomerID) VALUES (?)", [req.user.userId]);
        cartId = result.insertId;
    } else {
        cartId = carts[0].CartID;
    }

    if (quantity <= 0) {
        await req.app.locals.database.execute("DELETE FROM CartItem WHERE CartID = ? AND ProductID = ?", [cartId, productId]);
    } else {
        await req.app.locals.database.execute(`
            INSERT INTO CartItem (CartID, ProductID, Quantity) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE Quantity = ?
        `, [cartId, productId, quantity, quantity]);
    }

    res.status(200).json(new api_response(200, { message: "Cart updated" }));
});

export { getCart, updateCart };