import {User} from "../models/user.model.js"
import {asyncHandlers} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"


const registerUser = asyncHandlers( async (req, res) => {
  // console.log("req", req.body);
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

  const avatarLocalPath = req.files?.avatar?.[0].path;
  // console.log("req.files", req.files);
  //const coverImageLocalPath = req.files?.coverImage?.[0].path;

  let coverImageLocalPath;

 // check if files exist and coverImage is present
 if (
   req.files &&
   Array.isArray(req.files.coverImage) &&
   req.files.coverImage.length > 0
 ) {
   coverImageLocalPath = req.files.coverImage[0].path;
 }

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

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
      
        const refreshToken = user.generateRefreshToken()
       

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })  // validate before save dekhna hai

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token" + error)
    }
}

const loginUser = asyncHandlers( async (req, res) => {
  // 1. Get data from frontend
  const {username, email, password} = req.body

  // 2. validate input yaa toh username dedo yaa email dedo
  if(!(username || email)) {
    throw new ApiError(400,"Email or username is required")
  }

  if(!password) {
    throw new ApiError(400,"Password is required")
  }

  // 3.Find user
  const user = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
 
  // 4. Verify password
   const isPasswordValid = await user.isPasswordCorrect(password);

  if(!isPasswordValid) {
     throw new ApiError(401,"Invalid user credentails")
  }

  // 5. Generate token 
  const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

  // Remove password and unwanted fields from the user 
 const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

 //Send Cookies
 const options = {
        httpOnly: true,
        secure: true
  }
  
  //send response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandlers(async (req, res) => {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            refreshToken : undefined
          }
        },
        {
          new: true
        }
      )

      const options = {
        httpOnly: true,
        secure: true
      }

      return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandlers(async(req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken) {
    throw new ApiError(401,"Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user) {
      throw new ApiError(401,"Invalid refresh token")
    }
  
    if(incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401,"Refresh token is expired")
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user?._id)
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {accessToken, refreshToken: newRefreshToken},
        "Access Token refresh successfully"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token")
  }


})


export {registerUser, loginUser, logoutUser, refreshAccessToken}