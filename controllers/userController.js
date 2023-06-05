import {catchAsyncError} from '../middlewares/catchAsyncError.js'
import ErrorHandler from '../util/ErrorHandler.js'
import {User} from '../models/User.js'
import { sendToken } from '../util/sendToken.js';
import { sendEmail } from '../util/sendEmail.js';
import crypto from 'crypto'
import {Course} from '../models/Course.js'
import cloudinary from 'cloudinary'
import getDataUri from '../util/dataUri.js';
import { Stats } from '../models/Stats.js';

export const register = catchAsyncError(async(req,res,next)=>{


    const {name,email,password} = req.body;

     const file = req.file;
     


    if(!name || !email || !password || !file) return next(new ErrorHandler("Please Enter All field",400))
    const fileUri =  getDataUri(file)
    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content)

    let user = await User.findOne({email});

    if(user) return next(new ErrorHandler("User Already Exist",409))

    // upload file on cloudinary

    user = await User.create({
        name,
        email,
        password,
        avatar:{
            public_id:mycloud.public_id,
            url:mycloud.secure_url
        },
    });
     
    sendToken(res,user,"Registered Successfully",201)
})


// login
export const login = catchAsyncError(async(req,res,next)=>{


    const {email,password} = req.body;

    // const file = req.file;

    if( !email || !password) return next(new ErrorHandler("Please Enter All field",400))

    const user = await User.findOne({email}).select("+password");

    if(!user) return next(new ErrorHandler("Incorrect Email or Password",401))

    const isMatch = await user.comparePassword(password);

    if(!isMatch) return next(new ErrorHandler("Incorrect Email or Password",401))

     
    sendToken(res,user,`Welcome back, ${user.name}`,200)
})

// logout
export const logout = catchAsyncError(async (req, res, next) => {
    res
      .status(200)
      .cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .json({
        success: true,
        message: "Logged Out Successfully",
      });
  });

//My Profile
export const getMyProfile = catchAsyncError(async(req,res,next)=>{

    const user = await User.findById(req.user._id);
 
    res.status(200).json({
        success:true,
        user,
    })    
})

// change password
export const changePassword = catchAsyncError(async(req,res,next)=>{

    const {oldPassword,newPassword} = req.body;
    if( !oldPassword || !newPassword) return next(new ErrorHandler("Please Enter All field",400))

    const user = await User.findById(req.user._id).select("+password")
    
    const isMatch = await user.comparePassword(oldPassword);
    if( !isMatch) return next(new ErrorHandler("Incorrect old password",400))

    user.password = newPassword

    await user.save();

    res.status(200).json({
        success:true,
        message:"Password Changed Successfully"
    })    
})

// Update Profile
export const updateProfile = catchAsyncError(async(req,res,next)=>{

    const {name,email} = req.body;

    const user = await User.findById(req.user._id)
    
    if(name) user.name = name;
    if(email) user.email = email;

    await user.save();

    res.status(200).json({
        success:true,
        message:"Profile Updated Successfully"
    })    
})

export const updateProfilePicture = catchAsyncError(async(req,res,next)=>{
    // cloudnery add to do
    const file = req.file;
    const user = await User.findById(req.user._id)

     const fileUri =  getDataUri(file)
     const mycloud = await cloudinary.v2.uploader.upload(fileUri.content)

     await cloudinary.v2.uploader.destroy(user.avatar.public_id);

     user.avatar = {
        public_id:mycloud.public_id,
        url:mycloud.secure_url
     }
     await user.save();
    res.status(200).json({
        success:true,
        message:"Profile Pictur Updated Successfully",
    })
})

// forget password
export const forgetPassword = catchAsyncError(async(req,res,next)=>{
    const {email} = req.body;

    const user = await User.findOne({ email });

    if(!user) return next(new ErrorHandler("User not found",400))

    const resetToken = await user.getResetToken();

    await user.save();

    // Send token via email
   const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

    const message = `Click on the link to reset your password. ${url}. If You 
    have not request then please ignore`
    await sendEmail(user.email,"Course Reset Password",message)

    res.status(200).json({
        success:true,
        message:`Reset Token has been sent to ${user.email}`,
    })
})

// reset password
export const resetPassword = catchAsyncError(async(req,res,next)=>{
     const {token} = req.params;

     const resetPasswordToken = crypto
     .createHash("sha256")
     .update(token)
     .digest("hex");

     const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{
            $gt: Date.now(),
        },

     })
    
     if(!user) return next(new ErrorHandler("Token is invalid or has been expired"));

     user.password = req.body.password;
     user.resetPasswordToken=undefined;
     user.resetPasswordExpire=undefined;

     await user.save();

    res.status(200).json({
        success:true,
        message:"Password Changed Successfully",
    })
})

// Add to playList
export const addToPlaylist = catchAsyncError(async(req,res,next)=>{
    
    const user = await User.findById(req.user._id);

    const course = await Course.findById(req.body.id)

    if(!course) return next(new ErrorHandler("Invalid Course Id",404));

    const itemExist = user.playlist.find((item)=>{
        if(item.course.toString()===course._id.toString()) return true 
    })

    if(itemExist) return next(new ErrorHandler("Item Already Exist",409));

    user.playlist.push({
        course:course._id,
        poster:course.poster.url,
    })

    await user.save();

    res.status(200).json({
        success:true,
        message:"Add to playlist",
    })
})

// Remove from playList
export const removeFromPlaylist = catchAsyncError(async(req,res,next)=>{
    const user = await User.findById(req.user._id);

    const course = await Course.findById(req.query.id)

    if(!course) return next(new ErrorHandler("Invalid Course Id",404));
    
    const newPlayList = user.playlist.filter((item)=>{
        if(item.course.toString()!==course._id.toString()) return item;
    })

    user.playlist = newPlayList;

    await user.save();

    res.status(200).json({
        success:true,
        message:"Remove From playlist",
    })
})


// Admin Controllers
export const getAllUser = catchAsyncError(async(req,res,next)=>{
   
    const users = await User.find({})

    res.status(200).json({
        success:true,
        users
    })
})

// update user role
export const updateUserRole = catchAsyncError(async(req,res,next)=>{
   
    const user = await User.findById(req.params.id)

    if(!user) return next(new ErrorHandler("User Not Found",404));

    if(user.role==="user") user.role="admin"
    else user.role= 'user'

    await user.save();

    res.status(200).json({
        success:true,
        message:"role updated",
        role:user.role
    })
})

//delete user
export const deleteUser = catchAsyncError(async(req,res,next)=>{
   
    const user = await User.findById(req.params.id)

    if(!user) return next(new ErrorHandler("User Not Found",404));

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    console.log(user);

    await User.deleteOne({ "_id" : req.params.id});
   // cancel subscription
    

    res.status(200).json({
        success:true,
        message:"User Deleted",
    })
})

// delete my profile
export const deleteMyProfile = catchAsyncError(async(req,res,next)=>{
   
    const user = await User.findById(req.user._id)

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    console.log(user);

    await User.deleteOne({ "_id" : req.user._id});
   // cancel subscription
    

    res.status(200).cookie("token",null,{
        expires: new Date(Date.now()),
    }).json({
        success:true,
        message:"Your Profile Deleted",
    })
})

User.watch().on("change",async()=>{
    const stats = await Stats.find({}).sort({createdAt:'desc'}).limit(1);
    const subscription = await User.find({"subscription.stats":"active"});

    stats[0].subscriptions=subscription.length;
    stats[0].users = await User.countDocuments()
    stats[0].createdAt=new Date(Date.now());

    await stats[0].save();
})