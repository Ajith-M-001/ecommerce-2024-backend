import { start } from "repl";
import { myCache } from "../app.js";
import { TryCatch } from "../middleware/error.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { Order } from "../models/orders.js";
import { calculatePercentage, getChartData, getInventories } from "../utils/features.js";

export const getDashBoardStats = TryCatch(async (req, res, next) => {
  let stats;
  if (myCache.has("admin-stats")) {
    stats = JSON.parse(myCache.get("admin-stats")!);
  } else {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };

    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999),
    };

    const thisMonthProductsPromise = Product.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });
    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });
    const thisMonthUsersPromise = User.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });
    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });
    const thisMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });
    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const lastSixMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    });
      
      const latestTransactionsPromise = Order.find({}).select(["orderItems", "discount","total","status"]).limit(4)

    const [
      thisMonthOrders,
      thisMonthProducts,
      thisMonthusers,
      lastMonthOrders,
      lastMonthProducts,
      lastMonthUsers,
      productCount,
      allOrders,
      userCount,
      lastSixMonthOrders,
        categories,
      femaleUsersCount,
        maleUsersCount,
      latestTransaction
    ] = await Promise.all([
      thisMonthOrdersPromise,
      thisMonthProductsPromise,
      thisMonthUsersPromise,
      lastMonthOrdersPromise,
      lastMonthProductsPromise,
      lastMonthUsersPromise,
      Product.countDocuments(),
      Order.find({}).select("total"),
      User.countDocuments(),
      lastSixMonthOrdersPromise,
        Product.distinct("category"),
      User.countDocuments({gender:"female"}),
        User.countDocuments({ gender: "male" }),
      latestTransactionsPromise
    ]);

    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const changepercent = {
      revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
      product: calculatePercentage(
        thisMonthProducts.length,
        lastMonthProducts.length
      ),
      user: calculatePercentage(thisMonthusers.length, lastMonthUsers.length),
      order: calculatePercentage(
        thisMonthOrders.length,
        lastMonthOrders.length
      ),
    };

    const revenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const orderMonthCounts = new Array(6).fill(0);
    const orderMonthbyRevenue = new Array(6).fill(0);

    lastSixMonthOrders.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

      if (monthDiff < 6) {
        orderMonthCounts[6 - monthDiff - 1] += 1;
        orderMonthbyRevenue[6 - monthDiff - 1] += order.total;
      }
    });

    const count = {
      revenue,
      user: userCount,
      Product: productCount,
      order: allOrders.length,
    };

      const categoryCount= await getInventories({categories, productCount})

      const userRatio = {
          male: maleUsersCount,
          female:femaleUsersCount
      }

      const modifiedTransaction = latestTransaction.map((i) => ({
          _id: i._id,
          discount: i.discount,
          amount: i.total,
          quanity: i.orderItems.length,
          status:i.status,
      }))

      stats = {
        categoryCount,
      categories,
      changepercent,
      count,
      chart: {
        order: orderMonthCounts,
        revenue: orderMonthbyRevenue,
          },
          userRatio,
       latestTransaction: modifiedTransaction
      };
      
      myCache.set("admin-stats", JSON.stringify(stats))
  }
  return res.status(200).json({
    success: true,
    stats,
  });
});
export const getPieChart = TryCatch(async (req,res,next) => {
  let charts;
  if (myCache.has("admin-pie-charts")) {
    charts = JSON.parse(myCache.get("admin-pie-charts")!);
  } else {

    const allOrderPromise = Order.find({}).select([
      "total",
      "discount",
      "subtotal",
      "tax",
      "shippingCharges",
    ]);

    
    const [
      processingOrder,
      shippedOrder,
      deliveredOrder,
      categories,
      productCount,
      outOfStock,
      allOrders,
      allUsers,
      adminUsers,
      customerUsers,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrderPromise,
      User.find({}).select(["dob"]),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);


    const orderFullfillment = {
      processing: processingOrder,
      shipped: shippedOrder,
      delivered: deliveredOrder,
    };
    const productCategories= await getInventories({categories, productCount})

    const stockAvailablity = {
      inStock: productCount - outOfStock,
      outOfStock,
    };

    const grossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );

    const discount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );

    const productionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );

    const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);

    const marketingCost = Math.round(grossIncome * (30 / 100));

    const netMargin =
      grossIncome - discount - productionCost - burnt - marketingCost;

    const revenueDistribution = {
      netMargin,
      discount,
      productionCost,
      burnt,
      marketingCost,
    };

    const usersAgeGroup = {
      teen: allUsers.filter((i) => i.age < 20).length,
      adult: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
      old: allUsers.filter((i) => i.age >= 40).length,
    };

    const adminCustomer = {
      admin: adminUsers,
      customer: customerUsers,
    };

    charts = {
      orderFullfillment,
      productCategories,
      stockAvailablity,
      revenueDistribution,
      usersAgeGroup,
      adminCustomer,
    };
   myCache.set("admin-pie-charts", JSON.stringify(charts))
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getBarChart = TryCatch(async (req, res, next) => {
  let charts;
  const key = "adming-bar-charts";

  if (myCache.has(key)) {
    charts = JSON.parse(myCache.get(key)!)
  } else {
     const today = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const sixMonthProductPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const sixMonthUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const twelveMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

 const [products, users, orders] = await Promise.all([
      sixMonthProductPromise,
      sixMonthUsersPromise,
      twelveMonthOrdersPromise,
 ]);
    
     const productCounts = getChartData({ length: 6, today, docArr: products });
     const usersCounts = getChartData({ length: 6, today, docArr: users });
     const ordersCounts = getChartData({ length: 12, today, docArr: orders });
    
    charts = {
        users: usersCounts,
      products: productCounts,
      orders:ordersCounts
    }
    
    myCache.set(key, JSON.stringify(charts))
  }
   return res.status(200).json({
    success: true,
    charts,
  });
});
export const getLineChart = TryCatch(async (req,res,next) => {
  let charts;
  const key = "admin-line-charts";
  if (myCache.has(key)) {
    charts = JSON.parse(myCache.get(key)!)
  } else {
      const today = new Date();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    };

    const [products, users, orders] = await Promise.all([
      Product.find(baseQuery).select("createdAt"),
      User.find(baseQuery).select("createdAt"),
      Order.find(baseQuery).select(["createdAt", "discount", "total"]),
    ]);

    const productCounts = getChartData({ length: 12, today, docArr: products });
    const usersCounts = getChartData({ length: 12, today, docArr: users });
    const discount = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "discount",
    });
    const revenue = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: "total",
    });

    charts = {
      users: usersCounts,
      products: productCounts,
      discount,
      revenue,
    };

    myCache.set(key, JSON.stringify(charts))
  }
   return res.status(200).json({
    success: true,
    charts,
  });
});
