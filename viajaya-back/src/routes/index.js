const {Router} = require("express")
const userRoutes = require("./userRoutes")
const packRoutes = require("./packRoutes")
const classRoutes = require("./classRoutes")
const promoRoutes = require("./promoRoutes")
const buyRoutes = require("./buyRoutes")

const routes = Router()

routes
.use("/user", userRoutes)
.use("/pack", packRoutes)
.use("/class", classRoutes)
.use("/promo", promoRoutes)
.use("/buy", buyRoutes)

module.exports = routes