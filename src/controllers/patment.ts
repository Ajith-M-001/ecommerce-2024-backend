import { stripe } from "../app.js";
import { TryCatch } from "../middleware/error.js";
import { Coupon } from "../models/coupon.js";
import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";

export const createPaymentIntent = TryCatch(async (req, res, next) => {
  const { amount } = req.body;
    if (!amount)
    return next(new ErrorHandler("Please enter amount", 400));

 const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount) * 100, // Amount in the smallest currency unit (e.g., cents for USD)
      currency: 'inr', // Specify the currency
    });
    return res.status(200).json({
        success: true,
        clientSecret : paymentIntent.client_secret
    })
});

export const newCoupon = TryCatch(async (req,res,next) => {
    const { coupon, amount } = req.body;
    if (!coupon || !amount)
    return next(new ErrorHandler("Please enter both coupon and amount", 400));
    await Coupon.create({ code: coupon, amount });
    return res.status(201).json({
        success: true,
        message:`Coupon ${coupon} created successfully`
    })
})


export const applyDiscount = TryCatch(async (req,res,next) => {
    const { coupon } = req.query;
   
    const discount = await Coupon.findOne({ code: coupon })
    
    if (!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));
    
   return res.status(200).json({
    success: true,
    discount: discount.amount,
  });
})

export const getAllCoupon = TryCatch(async (req,res,next) => {
   
    const allCoupon = await Coupon.find({})
    
    
   return res.status(200).json({
    success: true,
     allCoupon,
  });
})
export const deleteCoupon = TryCatch(async (req, res, next) => {
    const { id } = req.params;
   
    const coupon = await Coupon.findByIdAndDelete(id)
    if (!coupon) {
    return next(new ErrorHandler("coupon not found",400))
}
    
    
   return res.status(200).json({
    success: true,
     message:"coupon deleted successfully",
  });
})