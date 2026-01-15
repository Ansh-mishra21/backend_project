// verify karega user hai yaa nahiii hai 

import { ApiError } from "../utils/apiError.js";
import { asyncHandlers } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandlers( async(req, res, next) => {
    try {
        //1. Get token 
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
        if(!token) {
            throw new ApiError(401,"Unauthorized request")
        }
    
        // verif token 
         const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        // Find user
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if (!user) {
          throw new ApiError(401, "Invalid access token");
        }
    
        // Attach user to request 
        req.user = user 
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

}) 