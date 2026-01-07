import connectDB from "./db/db.js";
import dotenv from 'dotenv';

connectDB();
dotenv.config({
    path: './env'
})
