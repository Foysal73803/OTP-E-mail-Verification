import nodemailer from "nodemailer";
import crypto from "crypto";
import session from "express-session";
import bcrypt from "bcrypt";
import colors from "colors";

import User from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";
import appError from "../utils/appError.js";

// Email Transporter Setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
    }
});

// Generate OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Register user and send OTP
export const register = catchAsync(async (req, res, next) => {
    const { name, email, pass } = req.body;

    let user = await User.findOne({ email });
    
    if (user && user.isVerified) {
        return next(new appError("This email already exists and is verified. Please log in.", 400));
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    const hashedPass = await bcrypt.hash(pass, 10);

    if (user && !user.isVerified) {
        user.name = name;
        user.hashedPass = hashedPass;
        user.otp = otp;
        user.otpExpiry = otpExpiry;
    } else {
        user = new User({ name, email, hashedPass, otp, otpExpiry });
    }
    
    await user.save();

    // await transporter.sendMail({
    //     from: process.env.EMAIL_USER,
    //     to: email,
    //     subject: "OTP Verification",
    //     text: `Your OTP is ${otp}`
    // });

    res.status(201).json({ success: true, message: "User registered. Please verify OTP sent to email." });
});

// Verify OTP
export const verifyOTP = catchAsync(async (req, res, next) => {
    let { email, otp } = req.body;

    if (!email || !otp) return next(new appError("Email and OTP are required.", 400));

    otp = otp.toString().trim();

    const user = await User.findOne({ email });
    if (!user) return next(new appError("User not found!", 404));
    if (user.isVerified) return next(new appError("User already verified.", 400));

    if (!user.otp || user.otp !== otp) {
        return next(new appError("Invalid OTP code.", 400));
    }

    if (user.otpExpiry && user.otpExpiry < new Date()) {
        return next(new appError("OTP has expired. Please request a new one.", 400)); 
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: "Email verified successfully. You can now log in." });
});

// Resend OTP
export const resendOTP = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return next(new appError("User not found", 404));
    if (user.isVerified) return next(new appError("User already verified and exists.", 400));

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Resend OTP Verification",
        text: `Your new OTP is ${otp}`
    });

    res.status(200).json({ success: true, message: "OTP resent successfully." });
});

// Login User
export const login = catchAsync(async (req, res, next) => {
    const { email, pass } = req.body;

    const user = await User.findOne({ email });
    if (!user) return next(new appError("User not found!", 400));

    const isMatch = await bcrypt.compare(pass, user.hashedPass);
    if (!isMatch) return next(new appError("Incorrect Password", 400));

    if (!user.isVerified) {
        return next(new appError("Email not verified. Please verify OTP", 400));
    }

    req.session.user = {
        id: user._id,
        email: user.email
    };

    res.status(200).json({ success: true, message: "Login Successful" });
});

//Logout user
export const logout = catchAsync(async (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: 'Error logging out' });
        res.json({ message: 'Logged out successfully' });
    });
});

// dashboard
export const dashboard = async (req, res) => {
    res.json({ message: `Welcome to the dashboard, ${req.session.user.name}` });
};