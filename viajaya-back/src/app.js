const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const routes = require("./routes/index.js")

const allowedOrigins = [
    // 'http://localhost:5173', // Permitir localhost para desarrollo
    'https://viajaya.com.co'  // Permitir tu dominio en producción
  ];

const app = express()

app.use(express.json())
app.use(cors());
app.use(morgan("dev"))
app.use("/", routes)
// app.use((req, res, next) => {
//     res.setHeader(
//       "Content-Security-Policy",
//       "default-src 'self'; upgrade-insecure-requests; script-src 'self' https://www.instagram.com https://checkout.wompi.co; frame-src 'self' https://www.instagram.com https://instagram.com; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; report-uri /csp-violation-report-endpoint"
//     );
//     next();
//   });
  
  
module.exports = app