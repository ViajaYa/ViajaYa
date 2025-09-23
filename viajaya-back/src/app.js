const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const routes = require("./routes/index.js")

// Actualización de dominios permitidos, incluyendo dominios de AWS EB
const allowedOrigins = [

    'http://localhost:5173',
    'http://localhost:5174',
    'https://viajaya.com.co',
    'https://www.viajaya.com.co',
    'https://viajaya-mve8.onrender.com'
    // Incluir cualquier dominio de AWS Elastic Beanstalk que se utilice
    // Por ejemplo: 'https://[nombre-app].elasticbeanstalk.com'
    // O cualquier otro dominio personalizado que se pueda configurar
];

// Función auxiliar para permitir entornos de desarrollo
const corsOptions = {
    origin: (origin, callback) => {
        // Permitir solicitudes sin origen (como las de Postman)
        if (!origin) return callback(null, true);
        
        // Permitir orígenes explícitamente listados
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // También permitir subdominios de elasticbeanstalk.com en producción
        if (origin.includes('elasticbeanstalk.com') || process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        callback(new Error("No permitido por CORS"));
    },
    credentials: true
};

const app = express()

app.use(express.json())
app.use(cors(corsOptions));
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