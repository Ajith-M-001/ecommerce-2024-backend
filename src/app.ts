// ecommerce-backend/src/app.ts

import express from "express";
import connectDB from "./db/connectDB.js"; // Import your DB connection
import { errorMiddleware } from "./middleware/error.js";
import userRoutes from './routes/user.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payment.js';
import DashBoardRoutes from './routes/stats.js';
import NodeCache from "node-cache";
import dotenv from 'dotenv'
import morgan from 'morgan'
import Stripe from "stripe";
import cors from "cors";
dotenv.config()

const app = express();
const port = process.env.PORT || 3000;
const stripeKey = process.env.STRIPE_KEY || ""


export const stripe = new Stripe(stripeKey)

export const myCache = new NodeCache()

// Middleware to parse JSON
app.use(express.json());
app.use(cors())
app.use(morgan("dev"))
app.use("/api/v1/user", userRoutes); // Use the router for user routes
app.use("/api/v1/product", productRoutes); // Use the router for product routes
app.use("/api/v1/order", orderRoutes); // Use the router for order routes
app.use("/api/v1/payment", paymentRoutes); // Use the router for payment routes
app.use("/api/v1/dashboard", DashBoardRoutes); // Use the router for payment routes

// Basic route to check if the server is running
app.get("/", (req, res) => {
  res.send("Server started");
});

app.use("/uploads", express.static("uploads"));

app.use(errorMiddleware); // Error middleware

// Create the startServer function using async/await
const startServer = async () => {
  try {
    // Connect to the database
    await connectDB();
    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1); // Exit the process if any error occurs
  }
};

// Call startServer to initialize the app
startServer();
