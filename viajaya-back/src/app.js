const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const routes = require("./routes/index.js")

const app = express()

app.use(express.json())
app.use(cors())
app.use(morgan("dev"))
app.use("/", routes)

module.exports = app