import { api_response } from "../utils/api-response.utils.js";
import async_handler from "../utils/async-handler.utils.js";
import bcrypt from "bcrypt";
import { api_error } from "../utils/api-errors.utils.js";
import crypto from "crypto";

// Helper: Generate random auth token
const generateAuthToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Register a new customer
const register = async_handler(async(req, res, next) => {
    const { name, email, password, contactNumber, address } = req.body;
    
    if (!name || !email || !password) {
        throw new api_error(400, "Name, email and password are required");
    }
    
    // Check if customer already exists
    const [existing] = await req.app.locals.database.execute(
        "SELECT * FROM Customer WHERE Email = ?", 
        [email]
    );
    
    if (existing.length > 0) {
        throw new api_error(400, "Customer already exists with this email");
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate auth token
    const authToken = generateAuthToken();
    
    // Insert into Customer table
    const [result] = await req.app.locals.database.execute(
        "INSERT INTO Customer (Name, Email, Password, ContactNumber, Address, AuthToken) VALUES (?, ?, ?, ?, ?, ?)",
        [name, email, hashedPassword, contactNumber || null, address || null, authToken]
    );
    
    res.status(201).json(
        new api_response(201, { 
            token: authToken,
            customerId: result.insertId,
            name,
            email
        }, "Customer registered successfully")
    );
});

// Login - returns auth token
const login = async_handler(async(req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        throw new api_error(400, "Email and password are required");
    }

    let user = null;
    let role = null;
    let userId = null;
    let storedHash = null;
    let authToken = null;

    // 1. Check in Customer table
    const [customers] = await req.app.locals.database.execute(
        "SELECT CustomerID AS id, Password, AuthToken, 'Customer' AS role FROM Customer WHERE Email = ?", 
        [email]
    );

    if (customers.length > 0) {
        const customer = customers[0];
        const match = await bcrypt.compare(password, customer.Password);
        if (!match) throw new api_error(401, "Invalid email or password");
        
        userId = customer.id;
        role = customer.role;
        authToken = generateAuthToken();
        await req.app.locals.database.execute("UPDATE Customer SET AuthToken = ? WHERE CustomerID = ?", [authToken, userId]);
    } 
    // 2. Check in Employee table (Admin/Staff)
    else {
        const [employees] = await req.app.locals.database.execute(
            "SELECT EmpID AS id, Password, Role AS role, AuthToken FROM Employee WHERE Email = ?", 
            [email]
        );

        if (employees.length === 0) {
            throw new api_error(401, "Invalid email or password");
        }

        const employee = employees[0];
        const match = await bcrypt.compare(password, employee.Password);
        if (!match) throw new api_error(401, "Invalid email or password");

        userId = employee.id;
        role = employee.role;
        authToken = generateAuthToken();
        await req.app.locals.database.execute("UPDATE Employee SET AuthToken = ? WHERE EmpID = ?", [authToken, userId]);
    }

    res.status(200).json(new api_response(200, {
        token: authToken,
        user: { userId, role, email }
    }, "Login successful"));
});

// Get current user info (requires auth middleware)
const getMe = async_handler(async (req, res) => {
  // Pehle check kar ki req.user sahi hai ya nahi
  if (!req.user || !req.user.userId || !req.user.role) {
    throw new api_error(401, "Unauthorized - Invalid user data");
  }

  const { userId, role } = req.user;

  let userData = null;

  try {
    if (role === "Customer") {
      const [rows] = await req.app.locals.database.execute(
        "SELECT CustomerID as userId, Name as name, Email as email, ContactNumber, Address, CreatedAt FROM Customer WHERE CustomerID = ?",
        [userId]
      );
      userData = rows[0];
      if (userData) userData.role = "Customer";
    } else if (role === "Supplier") {
      const [rows] = await req.app.locals.database.execute(
        "SELECT SupplierID as userId, Name as name, ContactEmail as email, Address FROM Supplier WHERE SupplierID = ?",
        [userId]
      );
      userData = rows[0];
      if (userData) userData.role = "Supplier";
    } else {
      // Admin / Staff
      const [rows] = await req.app.locals.database.execute(
        "SELECT EmpID as userId, Name as name, Email as email, Role as role, Designation, JoiningDate FROM Employee WHERE EmpID = ?",
        [userId]
      );
      userData = rows[0];
    }

    if (!userData) {
      throw new api_error(404, "User not found");
    }

    // Final safe user object (no undefined fields)
    const user = {
      userId: userData.userId,
      name: userData.name || userData.Name || "User",
      email: userData.email || userData.Email,
      role: userData.role || role,
      ContactNumber: userData.ContactNumber || null,
      Address: userData.Address || null,
      Designation: userData.Designation || null,
      CreatedAt: userData.CreatedAt || userData.JoiningDate || null
    };

    res.status(200).json(new api_response(200, { user }, "User fetched successfully"));
  } catch (err) {
    console.error("getMe error:", err);
    throw new api_error(500, "Failed to fetch user data");
  }
});

// Logout - invalidate token
const logout = async_handler(async(req, res, next) => {
    const { userId, role } = req.user;
    
    // Remove token from database
    if (role === "Customer") {
        await req.app.locals.database.execute(
            "UPDATE Customer SET AuthToken = NULL WHERE CustomerID = ?",
            [userId]
        );
    } else if (role === "Supplier") {
        await req.app.locals.database.execute(
            "UPDATE Supplier SET AuthToken = NULL WHERE SupplierID = ?",
            [userId]
        );
    } else {
        await req.app.locals.database.execute(
            "UPDATE Employee SET AuthToken = NULL WHERE EmpID = ?",
            [userId]
        );
    }
    
    res.status(200).json(
        new api_response(200, null, "Logout successful")
    );
});

const registerAdmin = async_handler(async (req, res) => {
    const { name, email, password, role, designation } = req.body;

    const validRoles = ['Admin', 'OfficeStaff', 'DeliveryStaff'];
    if (!validRoles.includes(role)) {
        throw new api_error(400, "Invalid role. Must be Admin, OfficeStaff or DeliveryStaff");
    }

    const [existing] = await req.app.locals.database.execute(
        "SELECT * FROM Employee WHERE Email = ?", [email]
    );
    if (existing.length > 0) {
        throw new api_error(400, "Employee already exists with this email");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const authToken = generateAuthToken();

    await req.app.locals.database.execute(
        "INSERT INTO Employee (Name, Email, Password, Role, Designation, JoiningDate, AuthToken) VALUES (?, ?, ?, ?, ?, CURDATE(), ?)",
        [name, email, hashedPassword, role, designation || null, authToken]
    );

    res.status(201).json(new api_response(201, {
        token: authToken,
        user: { name, email, role }
    }, "Admin/Staff registered successfully"));
});

export { register, login, getMe, logout, registerAdmin };