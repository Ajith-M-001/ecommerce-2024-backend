import express from "express";
import { myOrders, newOrders ,allOrders, getSingleOrder, processOrder, deleteOrder} from "../controllers/orders.js";
import { adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/new", newOrders)
router.get("/myorder", myOrders)
router.get("/allorders",adminOnly, allOrders)
router.route("/:id").get(getSingleOrder).put(adminOnly,processOrder).delete(adminOnly,deleteOrder)
export default router;