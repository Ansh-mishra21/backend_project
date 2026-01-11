import {User} from "../models/user.model.js"
import {asyncHandlers} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const registerUser = asyncHandlers( async (req, res) => {
   
    /* ============================
     1. Extract user details
  ============================ */
  const { username, email, fullname, password } = req.body;

  /* ============================
     2. Validate input fields
  ============================ */
  if (
    [username, email, fullname, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  /* ============================
     3. Check if user exists
  ============================ */

  const existedUser  = await User.findOne({
    $or: [{username}, {email}]
  })

  if(existedUser) {
    throw new ApiError(409, "User already exists")
  }

  /* ============================
     4. Handle avatar upload
  ============================ */

  const avatarLocalPath = req.files?.avatar[0].path;
  const coverImageLocalPath = req.files?.coverImage[0].path;

  if(!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage =  await uploadOnCloudinary(coverImageLocalPath)
  if(!avatar) {
    throw new ApiError(500, "Avatar upload failed")
  }

  /* ============================
     5. Create user in DB
  ============================ */
  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    password, // hashed automatically via pre-save hook
    avatar: avatar.url,
    coverImage: coverImage?.url || ""
  });


   /* ============================
     6. Remove sensitive data
  ============================ */
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User registration failed");
  }

  /* ============================
     7. Send response
  ============================ */
  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  );

})

export {registerUser}