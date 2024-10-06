// ecommerce-backend/src/routes/user.ts

import express from "express";
import { newUser,getAllUsers, getUser ,deleteUser} from "../controllers/user.js";
import { adminOnly } from "../middleware/auth.js";

// Create a router instance
const router = express.Router();

// Define the route - /api/v1/user/new
router.post("/new", newUser);

// Route - /api/v1/user/all
router.get("/all",adminOnly, getAllUsers);

// Route - /api/v1/user/dynamicID
router.route("/:id").get(getUser).delete( adminOnly,deleteUser);

export default router;
