const {Router} = require("express")
const userRoutes = require("./userRoutes")
const packRoutes = require("./packRoutes")
const classRoutes = require("./classRoutes")
const promoRoutes = require("./promoRoutes")
const buyRoutes = require("./buyRoutes")
const popupRoutes= require("./popupRoutes")
const numberRoutes= require("./numberRoutes")
const reservationRoutes= require(("./reservationRoutes"))
const instagramVideoRoutes = require(("./instagramVideoRoutes"))

const routes = Router()

routes
.use("/user", userRoutes)
.use("/pack", packRoutes)
.use("/class", classRoutes)
.use("/promo", promoRoutes)
.use("/buy", buyRoutes)
.use("/reservation", reservationRoutes)
.use("/popup", popupRoutes)
.use("/rifa", numberRoutes)
.use("number", numberRoutes)
.use("/insta", instagramVideoRoutes)

module.exports = routes