import fs from "fs"
import { v2 as cloudinary } from "cloudinary";
import { log } from "console";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

const uploadOnCloundinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null
    //upload file on cloudinary
   const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })
    //file hass been uploaded successfully
    console.log("File is uploaded on cloudinary". response.url);
    return response
  } catch (error) {
    fs.unlinkSync(localFilePath);  //remove the locally savde temporary file as the upload operation got failed
    return null
  }
}

export {uploadOnCloundinary}