import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"  //middlewares, routes, error handlers

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//Parses incoming JSON request bodies and limits the payload size to 16KB to enhance security and performance.
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

export default app
