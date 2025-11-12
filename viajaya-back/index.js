const app = require("./src/app.js")
const {conn} = require("./src/db.js")

const insertNumbers = require('./src/scripts/InsertNumbers.js')
const seedCommissionConfigs = require('./src/seedCommissionConfigs.js')

// Define puerto - Railway proporciona PORT automáticamente
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Escuchar en todas las interfaces para Railway

console.log('🚀 Iniciando servidor ViajaYa...');
console.log('🔧 Entorno:', process.env.NODE_ENV || 'development');
console.log('� Puerto:', PORT);
console.log('�📧 SendGrid configurado:', !!process.env.SENDGRID_API_KEY ? 'SÍ' : 'NO');

// ✅ CAMBIO CRÍTICO: Arrancar el servidor INMEDIATAMENTE
// Railway necesita que el servidor responda rápido a health checks
const server = app.listen(PORT, HOST, () => {
    const address = server.address();
    console.log(`✅ Server is listening on ${HOST}:${PORT}`);
    console.log(`📡 Railway URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'N/A'}`);
    console.log(`🏥 Health check available at /health`);
});

// ✅ Manejar señales de terminación
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM recibido - Railway está intentando matar el proceso');
    server.close(() => {
        console.log('🛑 Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('⚠️ SIGINT recibido - Interrupción manual');
    server.close(() => {
        console.log('🛑 Servidor cerrado correctamente');
        process.exit(0);
    });
});

// ✅ Sincronizar DB en paralelo (no bloquear el startup)
const syncOptions = process.env.NODE_ENV === 'production' 
    ? { alter: false }
    : { alter: true };

console.log('🔄 Sincronizando base de datos en background con opciones:', syncOptions);

conn.sync(syncOptions)
    .then(async () => {
        console.log('✅ Base de datos sincronizada');
        
        // Solo ejecutar seeds en desarrollo o primera vez
        if (process.env.NODE_ENV !== 'production' || process.env.FORCE_SEEDS === 'true') {
            console.log('🌱 Ejecutando seeds...');
            await insertNumbers();
            await seedCommissionConfigs();
            console.log('✅ Seeds completados');
        } else {
            console.log('⏭️  Skipping seeds en producción');
        }
    })
    .catch((error) => {
        console.error("❌ Error syncing the database:", error);
        // NO salir - el servidor ya está corriendo
    });