// ecommerce-backend/src/routes/user.ts

import express from "express";
import { applyDiscount, deleteCoupon, getAllCoupon, newCoupon,createPaymentIntent } from "../controllers/patment.js";
import { adminOnly } from "../middleware/auth.js";


const router = express.Router();

router.post('/create', createPaymentIntent);
router.get("/discount", applyDiscount);
router.post('/coupon/new',adminOnly, newCoupon);
router.get("/coupon/all",adminOnly, getAllCoupon);
router.delete("/coupon/:id", adminOnly,deleteCoupon);


export default router;
