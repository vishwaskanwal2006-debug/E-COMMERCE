import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables from root .env file
dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cors({
    origin: process.env.cors_origin || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["content-type", "auth-token"]
}));

// Health check
import { rout } from "./src/routes/healthcheck.route.js";
app.use("/api/healthcheck", rout);

app.get("/", (req, res) => {
    res.send("Welcome to e-commerce API – Fully Working!");
});

// ==================== ALL ROUTES ====================
import { authRouter } from "./src/routes/auth.routes.js";
import { productsRouter } from "./src/routes/products.routes.js";
import { categoriesRouter } from "./src/routes/categories.routes.js";
import { warehousesRouter } from "./src/routes/warehouses.routes.js";
import { suppliersRouter } from "./src/routes/suppliers.routes.js";
import { cart } from "./src/routes/cart.routes.js";
import { ordersRouter } from "./src/routes/orders.routes.js";
import { paymentsRouter } from "./src/routes/payments.routes.js";
import { adminRouter } from "./src/routes/admin.routes.js";
import userroute from "./src/routes/get_user_details.js";

// Auth routes (login, register, me, logout)
app.use("/api/auth", authRouter);

// Other routes
app.use("/api/users", userroute);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/warehouses", warehousesRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/cart", cart);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/admin", adminRouter);

// ==================== GLOBAL ERROR HANDLER ====================
app.use((err, req, res, next) => {
    console.error("Error:", err);
    
    const statusCode = err.status_code || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    res.status(statusCode).json({
        success: false,
        status_code: statusCode,
        message: message,
        errors: err.errors || [],
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});



// 404 handler (must be last)
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

export default app;