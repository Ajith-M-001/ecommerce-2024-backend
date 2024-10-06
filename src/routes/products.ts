import express from "express";
import { adminOnly } from "../middleware/auth.js";
import {
  newProduct,
  getlatestProducts,
  getAllCategories,
  getAdminProducts,
  getSingleProducts,
  updateProduct,
  deleteProduct,
  getAllProducts
} from "../controllers/product.js";
import { signleUpload } from "../middleware/multer.js";

// Create a router instance
const router = express.Router();

router.post("/new", adminOnly, signleUpload, newProduct);

router.get("/latest", getlatestProducts);
router.get("/all", getAllProducts);
router.get("/admin-products", adminOnly, getAdminProducts);
router.get("/categories", getAllCategories);
router
  .route("/:id")
  .get(getSingleProducts)
  .put(adminOnly,signleUpload, updateProduct)
  .delete(adminOnly,deleteProduct);

export default router;
