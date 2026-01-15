import mongoose, {Schema} from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"



const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,            // searching enable karni hai kisi field ke liye to index usekarte hai 
        trim: true        
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true        
    },

    fullname: {
        type: String,
        required: true,
        index: true,
        trim: true        
    },

    avatar: {
        type: String,  // cloudinary url
        required: true   
    },
    
    coverImage: {
        type: String     
    },

    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],

    password: {
        type: String,
        required: [true, "Password is required"]
    },

    refreshToken: {
        type: String
    }
},{timestamps: true})

//“Ye Mongoose pre-save middleware user ka password sirf tab bcrypt se hash karta hai jab password naya ho ya modify hua ho.”

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();  // error 1 : async await use kiya hai to last m next function call nhii karenge

    this.password = await bcrypt.hash(this.password, 10)
    //next();
})

// custom methos which check and compare passwords 

userSchema.method.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}


userSchema.method.generateAccessToken = function() {
    return jwt.sign (
        {
            _id: this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.method.generateRefreshToken = function() {
    return jwt.sign (
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}




const User = mongoose.model("User",userSchema);
export {User}