const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes.js");
const userRoutes = require("./src/routes/userRoutes.js");
const categoryRoutes = require("./src/routes/category.js");
const roomRoutes = require("./src/routes/roomRoutes.js");
const bookingRoutes = require("./src/routes/booking.js");
const searchRoutes = require("./src/routes/searchRoutes");
const checkoutRoutes = require("./src/routes/checkoutRoutes.js");
const banquetMenuRoutes = require("./src/routes/banquetMenuRoutes.js");
const banquetBookingRoutes = require("./src/routes/banquetBookingRoutes.js");
const banquetCategoryRoutes = require("./src/routes/banquetCategoryRoutes.js");
const restaurantCategoryRoutes = require("./src/routes/restaurantCategoryRoutes.js");
const restaurantOrderRoutes = require("./src/routes/restaurantOrderRoutes.js");
const kotRoutes = require("./src/routes/kotRoutes.js");

const planLimitRoutes = require("./src/routes/planLimitRoutes.js");
const roomInventoryChecklistRoutes = require("./src/routes/roomInventoryChecklistRoutes.js");
const menuItemRoutes = require("./src/routes/menuItemRoutes.js");
const inventoryRoutes = require("./src/routes/inventoryRoutes.js");
const inventoryCategoryRoutes = require("./src/routes/inventoryCategoryRoutes.js");
const vendorRoutes = require("./src/routes/vendorRoutes.js");
const laundryRoutes = require("./src/routes/laundryRoutes.js");
const laundryCategoryRoutes = require("./src/routes/laundryCategoryRoutes.js");
const laundryItemRoutes = require("./src/routes/laundryItemRoutes.js");
const roomServiceRoutes = require("./src/routes/roomServiceRoutes.js");
const invoiceRoutes = require("./src/routes/invoiceRoutes.js");
const auditRoutes = require("./src/routes/auditRoutes.js");
const dashboardRoutes = require("./src/routes/dashboardRoutes.js");
const cashTransactionRoutes = require("./src/routes/CashTransactionRoutes.js");
const nightAuditRoutes = require("./src/routes/nightAuditRoutes.js");
const subReportsRoutes = require("./src/routes/subReportsRoutes.js");
const reportRoutes = require("./src/routes/reportRoutes.js");
const housekeepingRoutes = require("./src/routes/housekeepingRoutes.js");

const { connectAuditDB } = require("./src/config/auditDatabase.js");
const { optimizeDatabase } = require("./src/utils/dbOptimization.js");
const { performanceMonitor } = require("./src/middleware/performanceMonitor.js");
const path = require("path");

// Initialize express app
const app = express();
// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  "https://hsm-frontend-kappa.vercel.app",
  "https://hsm-backend-alpha.vercel.app"
 
];

//next
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(performanceMonitor);

// Block ALL socket.io requests silently without logging
app.use((req, res, next) => {
  if (req.url.includes('socket.io')) {
    res.writeHead(404);
    res.end();
    return;
  }
  next();
});

// Serve uploaded files for fallback method
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint (before DB middleware)
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  
  res.json({
    status: dbState === 1 ? "ok" : "error",
    database: states[dbState] || 'unknown',
    dbState: dbState,
    mongoUri: process.env.MONGO_URI ? 'configured' : 'missing',
    mongoUriStart: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) : 'N/A',
    timestamp: new Date().toISOString()
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "API is running",
    mongoUri: process.env.MONGO_URI ? 'configured' : 'MISSING',
    dbState: mongoose.connection.readyState
  });
});

// Database connection
let connectionPromise = null;

// Simplified MongoDB connection for serverless
const connectToMongoDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    // Already connecting, wait for existing connection
    if (connectionPromise) return connectionPromise;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI not found");
  }

  connectionPromise = mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  try {
    await connectionPromise;
    console.log("MongoDB connected");
    connectionPromise = null;
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    connectionPromise = null;
    throw error;
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  
  try {
    await connectToMongoDB();
    next();
  } catch (error) {
    console.error('DB error:', error.message);
    res.status(503).json({ 
      error: 'Database unavailable',
      details: error.message
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/banquet-menus", banquetMenuRoutes);
app.use("/api/banquet-bookings", banquetBookingRoutes);
app.use("/api/banquet-categories", banquetCategoryRoutes);
app.use("/api/restaurant-categories", restaurantCategoryRoutes);
app.use("/api/restaurant-orders", restaurantOrderRoutes);
app.use("/api/kot", kotRoutes);
app.use("/api/plan-limits", planLimitRoutes);
app.use("/api/room-inventory-checklists", roomInventoryChecklistRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/inventory-categories", inventoryCategoryRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/laundry", laundryRoutes);
app.use("/api/laundry-categories", laundryCategoryRoutes);
app.use("/api/laundry-items", laundryItemRoutes);
app.use("/api/room-service", roomServiceRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/cash-transactions", cashTransactionRoutes);
app.use("/api/night-audit", nightAuditRoutes);
app.use("/api/sub-reports", subReportsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/housekeeping", housekeepingRoutes);




// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Server error", message: err.message });
});

const PORT = process.env.PORT || 5000;

// Initialize MongoDB connection
connectToMongoDB().catch(err => 
  console.error('Initial connection failed:', err.message)
);

// Start server for local development
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for serverless
module.exports = app;