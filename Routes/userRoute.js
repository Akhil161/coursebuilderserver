import express from 'express'
import { register,login, logout, getMyProfile, changePassword, updateProfile, updateProfilePicture, forgetPassword, resetPassword, addToPlaylist, removeFromPlaylist, getAllUser, updateUserRole, deleteUser, deleteMyProfile } from '../controllers/userController.js';
import { authorizeAdmin, isAuthenticated } from '../middlewares/auth.js';
import singleUpload from '../middlewares/multer.js';
const router = express.Router();

// to register a new user
router.route('/register').post(singleUpload, register)

// Login
router.route('/login').post(login)


// Logout
router.route('/logout').get(logout)

// Get my profile
router.route('/me').get(isAuthenticated, getMyProfile)

// Delete my profile
router.route('/me').delete(isAuthenticated,deleteMyProfile)

// change password
router.route('/changepassword').put(isAuthenticated, changePassword)

// updateProfile
router.route('/updateprofile').put(isAuthenticated, updateProfile)


// updateProfilePicture
router.route('/updateprofilepicture').put(isAuthenticated,singleUpload, updateProfilePicture)


// ForgotPassword
router.route('/forgetpassword').post(forgetPassword);

// ResetPassword
router.route('/resetpassword/:token').put(resetPassword);

// AddtoPlaylist
router.route('/addtoplaylist').post(isAuthenticated, addToPlaylist);

// removeToPlaylist
router.route('/removefromtoplaylist').delete(isAuthenticated, removeFromPlaylist);

// Admin Routes
router.route("/admin/users").get(isAuthenticated,authorizeAdmin,getAllUser)

router.route("/admin/user/:id")
.put(isAuthenticated,authorizeAdmin,updateUserRole)
.delete(isAuthenticated,authorizeAdmin,deleteUser)


export default router;