import { Request } from "express";
import { TryCatch } from "../middleware/error.js";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import { Product } from "../models/product.js";
import ErrorHandler from "../utils/utility-class.js";
import { rm, unlink } from "fs";
import { myCache } from "../app.js";
import { invalidateCache } from "../utils/features.js";

export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    if (!photo) {
      return next(new ErrorHandler("Please Add Photo", 400));
    }

    if (!name || !price || stock<0 || !category ) {
      rm(photo.path, () => {
        console.log("deleted");
      });
      return next(new ErrorHandler("Please enter All Fields", 400));
    }

    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photos: photo.path,
    });
    invalidateCache({product:true, admin:true})
    return res.status(201).json({
      success: true,
      message: "Product Created Successfully",
    });
  }
);

export const getlatestProducts = TryCatch(async (req, res, next) => {
  let products;
  if (myCache.has("latestProduct")) {
    products = JSON.parse(myCache.get("latestProduct")!)
  } else {
    
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
   myCache.set("latestProduct", JSON.stringify(products))
  }
  return res.status(200).json({
    success: true,
    products,
  });
});

export const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;
  if (myCache.has("allProducts")) {
    products=JSON.parse(myCache.get("allProducts")!)
  } else {
    
    products = await Product.find({});
    myCache.set("allProducts", JSON.stringify(products))
  }
  return res.status(200).json({
    success: true,
    products,
  });
});

export const getSingleProducts = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  let product;
  if (myCache.has(`product-${id}`)) {
    product = JSON.parse(myCache.get(`product-${id}`)!)
  } else {
    
     product = await Product.findById(id);
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
    myCache.set(`product-${id}`, JSON.stringify(product))
  }
  return res.status(200).json({
    success: true,
    product,
  });
});

export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;
  if (myCache.has("categories")) {
    categories=JSON.parse(myCache.get("categories")!)
  } else {
    
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories))
  }
  return res.status(200).json({
    success: true,
    categories,
  });
});

export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category } = req.body;
  const photo = req.file;
 


  // Find the product by ID
  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Invalid product", 404));
  }

  // If a new photo is uploaded, delete the old photo
  if (photo) {
    if (product.photos) {
      unlink(product.photos, (err) => {
        if (err) {
          console.error("Error deleting old photo:", err);
        } else {
          console.log("Old photo deleted");
        }
      });
    }
    // Update the 'photos' field with the new file path
    product.photos = photo.path;
  }

  // Update other fields only if they exist in the request body
  if (name) product.name = name;
  if (price) product.price = price;
  if (stock) product.stock = stock;
  if (category) product.category = category.toLowerCase(); // Make category lowercase
  // if (description) product.description = description;

  // Save the updated product
  await product.save();
 invalidateCache({product:true, admin:true, productId:String(product._id)})
  return res.status(200).json({
    success: true,
    message: "Product updated Successfully",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  console.log("product", product);
  if (product.photos) {
    unlink(product.photos, (err) => {
      if (err) {
        console.error("Error deleting product photo:", err);
      } else {
        console.log("Product photo deleted");
      }
    });
  }
  await Product.findByIdAndDelete(id);
   invalidateCache({product:true, admin:true, productId:String(product._id)})
  return res.status(200).json({
    success: true,
    message: "Product deleted Successfully",
  });
});

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery : BaseQuery= {
     
    };

    
    if (search) {
      baseQuery.name = {
         $regex: search,
        $options: "i",
      }
    }

    if (price) {
      baseQuery.price = {
        $lte: Number(price),
      }
    }

    if (category) {
      baseQuery.category = category
    }

     const productsPromise = Product.find(baseQuery)
        .sort(sort && { price: sort === "asc" ? 1 : -1 })
        .limit(limit)
        .skip(skip);

      const [products, filteredOnlyProduct] = await Promise.all([
        productsPromise,
        Product.find(baseQuery),
      ]);

 
    const totalPage = Math.ceil(filteredOnlyProduct.length / limit);
    return res.status(200).json({
      success: true,
      products,
      totalPage
    });
  }
);
