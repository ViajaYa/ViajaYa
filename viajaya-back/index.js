const app = require("./src/app.js")
const {conn} = require("./src/db.js")

const insertNumbers = require('./src/scripts/InsertNumbers.js')
const seedCommissionConfigs = require('./src/seedCommissionConfigs.js')

// Define puerto - Railway y otras plataformas proporcionarán PORT en la variable de entorno
const PORT = process.env.PORT || 3001;

console.log('🚀 Iniciando servidor ViajaYa...');
console.log('🔧 Entorno:', process.env.NODE_ENV || 'development');
console.log('📧 SendGrid configurado:', !!process.env.SENDGRID_API_KEY ? 'SÍ' : 'NO');

// ✅ En producción: NO usar alter (puede causar timeouts)
// ✅ En desarrollo: Sí usar alter para sincronizar cambios
const syncOptions = process.env.NODE_ENV === 'production' 
    ? { alter: false } // Solo validar, no modificar estructura
    : { alter: true };  // Permitir cambios en desarrollo

console.log('🔄 Sincronizando base de datos con opciones:', syncOptions);

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
        
        app.listen(PORT, () => {
            console.log(`🚀 Server listening on port ${PORT}`);
            console.log(`📡 Backend URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:' + PORT}`);
        });
    })
    .catch((error) => {
        console.error("❌ Error syncing the database:", error);
        process.exit(1); // Salir con error para que Railway lo detecte
    });