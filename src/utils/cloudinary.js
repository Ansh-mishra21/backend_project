import fs from "fs"
import { v2 as cloudinary } from "cloudinary";


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        // safe delete after success
       if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
          }
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        // safe delete after failure
        if (localFilePath && fs.existsSync(localFilePath)) {
             fs.unlinkSync(localFilePath);
         }
        return null;
    }
}

export {uploadOnCloudinary}