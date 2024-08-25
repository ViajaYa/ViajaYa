const {Router} = require("express")
const userRoutes = require("./userRoutes")
const packRoutes = require("./packRoutes")
const classRoutes = require("./classRoutes")
const promoRoutes = require("./promoRoutes")
const buyRoutes = require("./buyRoutes")
const popupRoutes= require("./popupRoutes")
const numberRoutes= require("./numberRoutes")



const routes = Router()

routes
.use("/user", userRoutes)
.use("/pack", packRoutes)
.use("/class", classRoutes)
.use("/promo", promoRoutes)
.use("/buy", buyRoutes)
.use("/popup", popupRoutes)
.use("/rifa", numberRoutes)
.use("number", numberRoutes)

module.exports = routes