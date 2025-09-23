const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const routes = require("./routes/index.js")

// Actualización de dominios permitidos para Render
const allowedOrigins = [
    // Desarrollo local
    'http://localhost:5173',
    'http://localhost:5174',

    // Producción - ViajaYa
    'https://viajaya.com.co',
    'https://www.viajaya.com.co',

    // Render (actualizado)
    'https://viajaya-mve8.onrender.com',

    // Permitir cualquier subdominio de onrender.com para flexibilidad
    // Esto es útil si cambias el nombre de la app o tienes múltiples entornos
];

// Función auxiliar para permitir entornos de desarrollo y Render
const corsOptions = {
    origin: (origin, callback) => {
        // Permitir solicitudes sin origen (como las de Postman, curl, etc.)
        if (!origin) return callback(null, true);

        // Permitir orígenes explícitamente listados
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Permitir cualquier subdominio de onrender.com (para Render)
        if (origin && origin.includes('onrender.com')) {
            return callback(null, true);
        }

        // Permitir en desarrollo cualquier origen localhost
        if (process.env.NODE_ENV === 'development' && origin && origin.includes('localhost')) {
            return callback(null, true);
        }

        console.warn(`🚫 Origen no permitido por CORS: ${origin}`);
        callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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