const express = require("express")
const cors = require('cors')
const mongoose = require('mongoose')
const connectDB = require('./config/connectDB');

const auth = require("./routes/auth");
const app=express()
app.use(express.json())
app.use(cors())
connectDB();


const PORT=process.env.PORT||4000

app.use("/Api/auth", auth)

app.get("/",(req,res)=>{
    res.send("server is running")
})

app.listen(PORT,()=>console.log(`server Running on PORT ${PORT}...`))