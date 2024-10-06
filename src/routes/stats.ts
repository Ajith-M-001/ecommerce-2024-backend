

import express from "express";
import { getBarChart, getDashBoardStats, getLineChart, getPieChart } from "../controllers/stats.js";
import { adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/stats",adminOnly,getDashBoardStats)
router.get("/pie",adminOnly, getPieChart)
router.get("/bar",adminOnly,getBarChart)
router.get("/line",adminOnly,getLineChart)

export default router;
