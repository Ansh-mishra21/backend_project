import { Router } from "express";
import { registerUSer } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([    // multer middleware 
        {
            name: "avatar",
            maxCoubt: 1
        },
        {
            name: "CoverImage",
            maxCount: 1
        }
    ]),
    registerUSer)

export default router