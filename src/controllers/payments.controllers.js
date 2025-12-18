import { api_response } from "../utils/api-response.utils.js";
import async_handler from "../utils/async-handler.utils.js";
import { api_error } from "../utils/api-errors.utils.js";

const createPaymentIntent = async_handler(async (req, res) => {
    if (req.user.role !== "Customer") throw new api_error(403, "Only customers can pay");

    const { orderId } = req.body;
    const [orders] = await req.app.locals.database.execute("SELECT * FROM `Order` WHERE OrderID = ? AND CustomerID = ?", [orderId, req.user.userId]);
    if (orders.length === 0) throw new api_error(404, "Order not found");

    // Replace with real gateway (PayPal, Stripe, Razorpay, etc.)
    const fakePaymentLink = `https://yourshop.com/pay/${orderId}?token=${Date.now()}`;

    res.status(200).json(new api_response(200, { paymentUrl: fakePaymentLink }));
});

const verifyPayment = async_handler(async (req, res) => {
    const { orderId, status } = req.body;

    if (status === "success" || status === "completed") {
        await req.app.locals.database.execute("UPDATE `Order` SET Status = 'paid' WHERE OrderID = ?", [orderId]);
        res.status(200).json(new api_response(200, { message: "Payment successful" }));
    } else {
        await req.app.locals.database.execute("UPDATE `Order` SET Status = 'failed' WHERE OrderID = ?", [orderId]);
        res.status(400).json(new api_response(400, null, "Payment failed"));
    }
});

export { createPaymentIntent, verifyPayment };