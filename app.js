import 'dotenv/config';
import express  from "express";
import colors from "colors";
import session from 'express-session';

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(express.json());

app.use(session({
    secret: 's567er6ryfhjfgjuyfkujti785789tihi978990yioghpersecreto87toiluglkrt7io8rfourti785rey',
    resave: false,
    saveUninitilized: true,
    cookie: {secure:false}
}));

app.use("/api/auth", authRoutes);

connectDB();

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`.bgBlue);
});