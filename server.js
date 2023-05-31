import app from "./app.js";
import { connectDB } from "./config/database.js";
import cloudinary from 'cloudinary'
import Razorpay from "razorpay";
import nodeCron from 'node-cron';
import {Stats} from './models/Stats.js'
// npm run dev

connectDB();

cloudinary.v2.config({
   cloud_name:process.env.CLOUDINARY_CLIENT_NAME,
   api_key:process.env.CLOUDINARY_CLIENT_API,
   api_secret:process.env.CLOUDINARY_CLIENT_SECRET,
})
export const instance = new Razorpay({
   key_id: "rzp_test_nhxZPF9Cw2SK3D",
   key_secret: "HhqfTsp2FzZllqqx3SBFmqlF",
 });
// meaning  second minute hour day  month year
 nodeCron.schedule("0 0 0 1 * *",async()=>{
   try{
       await Stats.create({})
   } catch (error){
      console.log(error);
   }
 })



app.listen(process.env.PORT,()=>{
   console.log(`Server is working on port: ${process.env.PORT}`);
})