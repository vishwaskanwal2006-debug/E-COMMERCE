import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Search, ShoppingCart, User, LogOut, Package, Menu, X, Plus, Minus, 
  Trash2, Home, Settings, Store, TrendingUp, Users, DollarSign,
  ChevronRight, Filter, Star, Heart, Calendar, Clock, CheckCircle, 
  XCircle, AlertCircle, Info, Mail
} from 'lucide-react';

// API Configuration
const API_BASE_URL = 'http://localhost:4004/api';

// Toast Notification Component
const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  return (
    <div className={`fixed top-4 right-4 ${bgColors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center space-x-3`}>
      {type === 'success' && <CheckCircle size={20} />}
      {type === 'error' && <XCircle size={20} />}
      {type === 'warning' && <AlertCircle size={20} />}
      {type === 'info' && <Info size={20} />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-4 hover:opacity-80">
        <X size={18} />
      </button>
    </div>
  );
};

// Toast Context
const ToastContext = createContext();
const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => setToast({ message, type });
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </ToastContext.Provider>
  );
};
const useToast = () => useContext(ToastContext);

// Auth Context
const AuthContext = createContext();
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth-token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchUser();
    else setLoading(false);
  }, [token]);

  const fetchUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'auth-token': token }
    });
    const data = await response.json();


    console.log("Response from /auth/me:", data);

    // Admin aur Customer dono ke liye kaam karega
    if (data.success || (data.status_code === 200) || (data.statusCode === 200)) {
      setUser(data.data?.user || data.user);
    } else {
      console.log("Invalid response, logging out:", data);
      logout();
    }
  } catch (error) {
    console.error('Failed to fetch user:', error);
    logout();
  } finally {
    setLoading(false);
  }
};

  const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  
  // YE LINE CHANGE KAR DE
  if (data.success || data.status_code === 200 || data.statusCode === 200) {
    localStorage.setItem('auth-token', data.data?.token || data.token);
    setToken(data.data?.token || data.token);
    setUser(data.data?.user || data.user);
    return { success: true };
  }
  
  return { success: false, message: data.message || 'Login failed' };
};

  const register = async (name, email, password, contactNumber, address) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, contactNumber, address })
    });
    const data = await response.json();
    if (data.status_code === 201) {
      localStorage.setItem('auth-token', data.data.token);
      setToken(data.data.token);
      return { success: true };
    }
    return { success: false, message: data.message };
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'auth-token': token }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    localStorage.removeItem('auth-token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Cart Context
const CartContext = createContext();

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user?.role === "Customer") {
      fetchCart();
    }
  }, [token, user]);

  const fetchCart = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: { "auth-token": token },
      });

      const data = await response.json();
      if (data.status_code === 200) {
        setCart(data.data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  };

  const updateCart = async (productId, quantity) => {
    try {
      await fetch(`${API_BASE_URL}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      fetchCart();
    } catch (err) {
      console.error("Failed to update cart:", err);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.Quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.Price * item.Quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ cart, updateCart, fetchCart, cartCount, cartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Login Page
const LoginPage = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.message || 'Login failed');
      showToast(result.message || 'Login failed', 'error');
    } else {
      showToast('Login successful!', 'success');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="icon-circle">
            <Store size={40} className="icon-blue" />
          </div>
          <h2>Welcome Back!</h2>
          <p>Sign in to continue shopping</p>
        </div>

        {error && (
          <div className="error-box">
            <AlertCircle size={18} className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="switch-auth">
          <p>
            Don't have an account?{' '}
            <button onClick={onSwitchToRegister} className="switch-link">
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};


// Register Page
const RegisterPage = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', contactNumber: '', address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.contactNumber,
      formData.address
    );

    setLoading(false);

    if (!result.success) {
      setError(result.message || 'Registration failed');
      showToast(result.message || 'Registration failed', 'error');
    } else {
      showToast('Account created successfully!', 'success');
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <div className="icon-circle-purple">
            <User size={40} className="icon-purple" />
          </div>
          <h2>Create Account</h2>
          <p>Join us and start shopping!</p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="input-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="input-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="input-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="input-group">
            <label>Contact Number</label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="1234567890"
            />
          </div>

          <div className="input-group">
            <label>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Your shipping address"
              rows="2"
            />
          </div>

          <button type="submit" disabled={loading} className="register-button">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="switch-auth">
          <p>
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="switch-link-purple">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};


// Header Component
// import "./Header.css";

const Header = ({ onNavigate, currentPage }) => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { showToast } = useToast();

  const handleLogout = async () => {
    await logout();
    showToast("Logged out successfully", "info");
  };

  return (
    <header className="header">
      <div className="header-container">

        {/* LEFT SIDE */}
        <div className="header-left">
          <div
            onClick={() => onNavigate("home")}
            className="brand"
          >
            <Store size={32} className="brand-icon" />
            <h1 className="brand-title">Aurelle</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            <button
              onClick={() => onNavigate("home")}
              className={`nav-btn ${currentPage === "home" ? "active" : ""}`}
            >
              <Home size={18} />
              <span>Home</span>
            </button>

            {user?.role === "Customer" && (
              <button
                onClick={() => onNavigate("orders")}
                className={`nav-btn ${currentPage === "orders" ? "active" : ""}`}
              >
                <Package size={18} />
                <span>My Orders</span>
              </button>
            )}

            {["Admin", "OfficeStaff"].includes(user?.role) && (
              <button
                onClick={() => onNavigate("admin")}
                className={`nav-btn ${currentPage === "admin" ? "active" : ""}`}
              >
                <Settings size={18} />
                <span>Admin</span>
              </button>
            )}
          </nav>
        </div>

        {/* RIGHT SIDE */}
        <div className="header-right">

          {/* Cart */}
          {user?.role === "Customer" && (
            <button
              onClick={() => onNavigate("cart")}
              className="cart-btn"
            >
              <ShoppingCart size={24} className="cart-icon" />
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </button>
          )}

          {/* User Profile */}
          <div className="profile-box">
            <div className="avatar">
              <User size={18} className="avatar-icon" />
            </div>
            <div>
              <p className="profile-name">{user?.Name || user?.name}</p>
              <p className="profile-role">{user?.role}</p>
            </div>

            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={18} className="logout-icon" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="mobile-menu">

          {/* Profile */}
          <div className="mobile-profile">
            <div className="mobile-avatar">
              <User size={20} className="avatar-icon" />
            </div>
            <div>
              <p className="profile-name">{user?.Name || user?.name}</p>
              <p className="profile-role">{user?.role}</p>
            </div>
          </div>

          <nav className="mobile-nav">
            <button
              onClick={() => {
                onNavigate("home");
                setMobileMenuOpen(false);
              }}
              className="mobile-nav-btn"
            >
              <Home size={20} />
              <span>Home</span>
            </button>

            {user?.role === "Customer" && (
              <button
                onClick={() => {
                  onNavigate("orders");
                  setMobileMenuOpen(false);
                }}
                className="mobile-nav-btn"
              >
                <Package size={20} />
                <span>My Orders</span>
              </button>
            )}

            {["Admin", "OfficeStaff"].includes(user?.role) && (
              <button
                onClick={() => {
                  onNavigate("admin");
                  setMobileMenuOpen(false);
                }}
                className="mobile-nav-btn"
              >
                <Settings size={20} />
                <span>Admin Panel</span>
              </button>
            )}

            {/* Logout */}
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="mobile-nav-btn logout-red"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};


// Product Card Component
const ProductCard = ({ product, onAddToCart }) => {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-card-image">
        <img
          src={product.Image || 'https://via.placeholder.com/400x300?text=Product+Image'}
          alt={product.Name}
          className={isHovered ? "zoomed" : ""}
        />
        <div className="fav-btn">
          <button>
            <Heart size={18} />
          </button>
        </div>
      </div>

      <div className="product-card-body">
        <h3 className="product-title">{product.Name}</h3>
        <p className="product-desc">{product.Description}</p>

        <div className="price-row">
          <div>
            <span className="product-price">${product.Price}</span>
            <div className="rating">
              <Star size={14} />
              <Star size={14} />
              <Star size={14} />
              <Star size={14} />
              <Star size={14} className="inactive-star" />
              <span className="rating-value">(4.0)</span>
            </div>
          </div>
        </div>

        {user?.role === "Customer" && (
          <div className="add-row">
            <div className="qty-box">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                <Minus size={16} />
              </button>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
              />

              <button onClick={() => setQuantity(quantity + 1)}>
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={() => onAddToCart(product.ProductID, quantity)}
              className="btn-add"
            >
              <ShoppingCart size={18} />
              <span>Add</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


// Home Page
const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { updateCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `${API_BASE_URL}/products?q=${encodeURIComponent(searchQuery)}`
        : `${API_BASE_URL}/products`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status_code === 200) {
        setProducts(data.data.products || []);
      }
    } catch (error) {
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId, quantity) => {
    await updateCart(productId, quantity);
    showToast(`Added ${quantity} item(s) to cart!`, "success");
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-header">
        <div className="hero-content">
          <h1>Welcome to Aurelle!</h1>
          <p>Quality You Want. Convenience You Deserve.</p>

          <div className="search-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="products-section">
        <div className="products-header">
          <h2>
            {searchQuery
              ? `Search results for "${searchQuery}"`
              : "All Products"}
          </h2>

          <button className="filter-btn">
            <Filter size={18} /> Filter
          </button>
        </div>

        {/* Loader */}
        {loading ? (
          <div className="loader">
            <div className="spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <div className="no-icon">
              <Search size={48} />
            </div>
            <h3>No products found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard
                key={product.ProductID}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// Cart Page
// import React, { useState } from "react";
// import { ShoppingCart, Minus, Plus, Trash2, CheckCircle, Info } from "lucide-react";
// import { useCart } from "../hooks/useCart";
// import { useAuth } from "../hooks/useAuth";
// import { useToast } from "../hooks/useToast";
// import { API_BASE_URL } from "../config";
// import "./CartPage.css";

const CartPage = () => {
  const { cart, updateCart, cartTotal } = useCart();
  const { token } = useAuth();
  const [creatingOrder, setCreatingOrder] = useState(false);
  const { showToast } = useToast();

  const handleQuantityChange = (productId, newQuantity) => {
    updateCart(productId, newQuantity);
  };

  const handleRemoveItem = (productId) => {
    updateCart(productId, 0);
    showToast("Item removed from cart", "info");
  };

  const handleCheckout = async () => {
    setCreatingOrder(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "auth-token": token }
      });

      const data = await response.json();

      if (data.status_code === 201) {
        showToast("Order placed successfully!", "success");
        updateCart(null, null);
      } else {
        showToast("Failed to create order", "error");
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      showToast("Checkout failed", "error");
    } finally {
      setCreatingOrder(false);
    }
  };

  // EMPTY CART VIEW
  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <div className="empty-box">
          <div className="empty-icon">
            <ShoppingCart size={80} color="#2563eb" />
          </div>
          <h2 className="empty-title">Your cart is empty</h2>
          <p className="empty-text">Start shopping to add items to your cart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1 className="cart-title">
          <ShoppingCart size={32} />
          Shopping Cart ({cart.length} items)
        </h1>

        <div className="cart-grid">
          {/* LEFT SIDE — ITEMS */}
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.ProductID} className="cart-item">
                <div className="cart-item-content">

                  <img
                    src={item.Image || "https://via.placeholder.com/120"}
                    alt={item.Name}
                  />

                  <div className="item-details">
                    <h3 className="item-name">{item.Name}</h3>
                    <p className="item-price">Price: ${item.Price}</p>

                    <div className="item-controls">
                      <div className="quantity-box">
                        <button
                          className="quantity-btn"
                          disabled={item.Quantity <= 1}
                          onClick={() =>
                            handleQuantityChange(item.ProductID, item.Quantity - 1)
                          }
                        >
                          <Minus size={16} />
                        </button>

                        <span className="quantity-value">{item.Quantity}</span>

                        <button
                          className="quantity-btn"
                          onClick={() =>
                            handleQuantityChange(item.ProductID, item.Quantity + 1)
                          }
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item.ProductID)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="item-total">
                    ${(item.Price * item.Quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT SIDE — SUMMARY */}
          <div className="summary-box">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <span style={{ color: "green" }}>Free</span>
            </div>

            <div className="summary-row">
              <span>Tax</span>
              <span>${(cartTotal * 0.1).toFixed(2)}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>Total</span>
              <span>${(cartTotal * 1.1).toFixed(2)}</span>
            </div>

            <button
              className="checkout-btn"
              disabled={creatingOrder}
              onClick={handleCheckout}
            >
              {creatingOrder ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg className="spinner" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                    <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle className="mr-2" size={20} />
                  Proceed to Checkout
                </span>
              )}
            </button>

            <div className="secure-info">
              <Info size={14} />
              Secure checkout guaranteed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// export default CartPage;


// Orders Page
const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: { "auth-token": token },
      });
      const data = await response.json();
      if (data.status_code === 200) setOrders(data.data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="orders-page">
      {loading ? (
        <div className="loading-wrapper">
          <div className="loader"></div>
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-icon">
            <Package size={70} />
          </div>
          <h2>No Orders Yet</h2>
          <p>Start shopping to place your first order!</p>
        </div>
      ) : (
        <div className="orders-container">
          <h1 className="orders-title">
            <Package className="orders-title-icon" size={30} />
            My Orders ({orders.length})
          </h1>

          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.OrderID} className="order-card">
                <div className="order-header">
                  <div>
                    <div className="order-id-row">
                      <h3 className="order-id">Order #{order.OrderID}</h3>
                      <span className={`order-status status-${order.Status}`}>
                        {order.Status.charAt(0).toUpperCase() + order.Status.slice(1)}
                      </span>
                    </div>

                    <div className="order-date-time">
                      <span>
                        <Calendar size={14} />{" "}
                        {new Date(order.CreatedAt).toLocaleDateString("en-US")}
                      </span>

                      <span>
                        <Clock size={14} />{" "}
                        {new Date(order.CreatedAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="order-amount">
                    <p className="amount-label">Total Amount</p>
                    <p className="amount-value">${order.TotalAmount}</p>
                  </div>
                </div>

                <div className="order-footer">
                  <button className="view-details-btn">
                    View Details <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


// Admin Panel
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (activeTab === 'customers') fetchCustomers();
    else if (activeTab === 'employees') fetchEmployees();
    else if (activeTab === 'orders') fetchOrders();
  }, [activeTab]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/customers`, {
        headers: { "auth-token": token }
      });
      const data = await response.json();
      if (data.status_code === 200) setCustomers(data.data.customers || []);
    } catch {}
    setLoading(false);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/employees`, {
        headers: { "auth-token": token }
      });
      const data = await response.json();
      if (data.status_code === 200) setEmployees(data.data.employees || []);
    } catch {}
    setLoading(false);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/all`, {
        headers: { "auth-token": token }
      });
      const data = await response.json();
      if (data.status_code === 200) setOrders(data.data.orders || []);
    } catch {}
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.status_code === 200) {
        showToast("Order status updated", "success");
        fetchOrders();
      }
    } catch {
      showToast("Failed to update order status", "error");
    }
  };

  // unauthorized
  if (!["Admin", "OfficeStaff"].includes(user?.role)) {
    return (
      <div className="admin-center-wrapper">
        <div className="admin-center-box">
          <AlertCircle size={80} className="admin-center-icon" />
          <h2 className="admin-center-title">Access Denied</h2>
          <p className="admin-center-desc">You do not have permission to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <div className="admin-container">

        {/* Header */}
        <div className="admin-header">
          <h1 className="admin-title">
            <Settings size={32} className="admin-title-icon" />
            Admin Dashboard
          </h1>
          <p className="admin-subtitle">Manage your e-commerce platform</p>
        </div>

        {/* Stats Boxes */}
        <div className="admin-stats-grid">
          <div className="stat-box stat-blue">
            <div className="stat-top">
              <div className="stat-icon-wrapper"><TrendingUp size={24} /></div>
              <span className="stat-value">
                ${orders.reduce((sum, o) => sum + parseFloat(o.TotalAmount), 0).toFixed(2)}
              </span>
            </div>
            <p className="stat-label">Total Revenue</p>
          </div>

          <div className="stat-box stat-green">
            <div className="stat-top">
              <div className="stat-icon-wrapper"><Package size={24} /></div>
              <span className="stat-value">{orders.length}</span>
            </div>
            <p className="stat-label">Total Orders</p>
          </div>

          <div className="stat-box stat-purple">
            <div className="stat-top">
              <div className="stat-icon-wrapper"><Users size={24} /></div>
              <span className="stat-value">{customers.length}</span>
            </div>
            <p className="stat-label">Total Customers</p>
          </div>

          <div className="stat-box stat-orange">
            <div className="stat-top">
              <div className="stat-icon-wrapper"><DollarSign size={24} /></div>
              <span className="stat-value">
                {orders.filter((o) => o.Status === "pending").length}
              </span>
            </div>
            <p className="stat-label">Pending Orders</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs-box">
          <div className="admin-tabs">
            <button
              className={`admin-tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>

            <button
              className={`admin-tab-btn ${activeTab === "customers" ? "active" : ""}`}
              onClick={() => setActiveTab("customers")}
            >
              Customers
            </button>

            {user?.role === "Admin" && (
              <button
                className={`admin-tab-btn ${activeTab === "employees" ? "active" : ""}`}
                onClick={() => setActiveTab("employees")}
              >
                Employees
              </button>
            )}

            <button
              className={`admin-tab-btn ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              All Orders
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="admin-loading-wrapper">
            <div className="admin-loader"></div>
          </div>
        ) : (
          <>
            {/* Dashboard */}
            {activeTab === "dashboard" && (
              <div className="admin-card">
                <h3 className="admin-card-title">Welcome to Admin Dashboard</h3>
                <p className="admin-card-text">
                  Use the tabs above to manage customers, employees, and orders.
                </p>
              </div>
            )}

            {/* Customers */}
            {activeTab === "customers" && (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Contact</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.CustomerID}>
                        <td>#{customer.CustomerID}</td>
                        <td>
                          <div className="table-name">
                            <div className="table-avatar"><User size={16} /></div>
                            {customer.Name}
                          </div>
                        </td>
                        <td>{customer.Email}</td>
                        <td>{customer.ContactNumber || "N/A"}</td>
                        <td>{new Date(customer.CreatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Employees */}
            {activeTab === "employees" && (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Designation</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.EmpID}>
                        <td>#{employee.EmpID}</td>
                        <td>{employee.Name}</td>
                        <td>{employee.Email}</td>
                        <td>
                          <span className="badge-blue">{employee.Role}</span>
                        </td>
                        <td>{employee.Designation}</td>
                        <td>{new Date(employee.JoiningDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Orders */}
            {activeTab === "orders" && (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.OrderID} className="order-card">
                    <div className="order-card-header">
                      <div>
                        <h3 className="order-id">Order #{order.OrderID}</h3>
                        <p className="order-info">
                          <User size={14} /> Customer: {order.CustomerID}
                        </p>
                        <p className="order-info">
                          <Calendar size={14} />{" "}
                          {new Date(order.CreatedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="order-amount-box">
                        <p className="order-amount">${order.TotalAmount}</p>
                        <select
                          className="status-select"
                          value={order.Status}
                          onChange={(e) =>
                            updateOrderStatus(order.OrderID, e.target.value)
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};


// Main App Component
const App = () => {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mb-6"></div>
          <p className="text-gray-700 text-xl font-semibold">Loading Aurelle...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return showRegister 
      ? <RegisterPage onSwitchToLogin={() => setShowRegister(false)} />
      : <LoginPage onSwitchToRegister={() => setShowRegister(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={setCurrentPage} currentPage={currentPage} />
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'cart' && user?.role === 'Customer' && <CartPage />}
      {currentPage === 'orders' && user?.role === 'Customer' && <OrdersPage />}
      {currentPage === 'admin' && ['Admin', 'OfficeStaff'].includes(user?.role) && <AdminPanel />}
    </div>
  );
};

// Root Component with Providers
const Root = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default Root;