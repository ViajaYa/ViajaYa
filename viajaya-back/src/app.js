const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const routes = require("./routes/index.js")

// Actualización de dominios permitidos para Railway y Vercel
const allowedOrigins = [
    // Desarrollo local
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',

    // Producción - ViajaYa (PRINCIPAL)
    'https://viajaya.com.co',
    'https://www.viajaya.com.co',

    // Railway (backend)
    'https://viajaya-production.up.railway.app',

    // Vercel previews
    'https://viaja-786ywfg3b-viajaya1s-projects.vercel.app',
];

// Configuración CORS simplificada y permisiva
const corsOptions = {
    origin: (origin, callback) => {
        // ✅ Permitir solicitudes sin origen (Postman, curl, server-to-server)
        if (!origin) {
            console.log('✅ CORS: Permitiendo solicitud sin origen');
            return callback(null, true);
        }

        // ✅ Permitir orígenes en la lista
        if (allowedOrigins.includes(origin)) {
            console.log('✅ CORS: Permitiendo origen:', origin);
            return callback(null, true);
        }

        // ✅ Permitir subdominios de vercel.app
        if (origin.includes('vercel.app')) {
            console.log('✅ CORS: Permitiendo Vercel preview:', origin);
            return callback(null, true);
        }

        // ✅ Permitir localhost en desarrollo
        if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
            console.log('✅ CORS: Permitiendo localhost:', origin);
            return callback(null, true);
        }

        // ❌ Rechazar otros orígenes
        console.warn('🚫 CORS: Origen no permitido:', origin);
        callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 horas de cache para preflight
};

const app = express()

// ✅ IMPORTANTE: CORS debe ir ANTES de las rutas
app.use(cors(corsOptions));
app.use(express.json())
app.use(morgan("dev"))

// ✅ Manejar preflight requests explícitamente
app.options('*', cors(corsOptions));

app.use("/", routes)

// ✅ Middleware global de manejo de errores (DEBE IR AL FINAL)
// Esto asegura que todos los errores devuelvan JSON en lugar de HTML
app.use((err, req, res, next) => {
    console.error('❌ ERROR NO MANEJADO:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // Si ya se envió una respuesta, delegar al manejador por defecto
    if (res.headersSent) {
        return next(err);
    }

    // Devolver siempre JSON, nunca HTML
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? {
            message: err.message,
            stack: err.stack
        } : 'Error interno del servidor'
    });
});

// app.use((req, res, next) => {
//     res.setHeader(
//       "Content-Security-Policy",
//       "default-src 'self'; upgrade-insecure-requests; script-src 'self' https://www.instagram.com https://checkout.wompi.co; frame-src 'self' https://www.instagram.com https://instagram.com; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; report-uri /csp-violation-report-endpoint"
//     );
//     next();
//   });
  
  
module.exports = app