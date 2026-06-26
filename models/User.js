import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    hashedPass: {
        type: String,
        required: true
    },
    otp: {
        type: String
    },
    otpExpiry: {
        type: Date
    },
    isVerified: {
        type: Boolean, 
        default: false
    } 
});

const User = mongoose.model("otp", userSchema);

export default User;