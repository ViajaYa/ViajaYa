const app = require("./src/app.js")
const {conn} = require("./src/db.js")

const insertNumbers = require('./src/scripts/InsertNumbers.js')
const seedCommissionConfigs = require('./src/seedCommissionConfigs.js')

// Define puerto - Railway y otras plataformas proporcionarán PORT en la variable de entorno
const PORT = process.env.PORT || 3001;

console.log('🚀 Iniciando servidor ViajaYa...');
console.log('🔧 Entorno:', process.env.NODE_ENV || 'development');
console.log('📧 SendGrid configurado:', !!process.env.SENDGRID_API_KEY ? 'SÍ' : 'NO');

conn.sync({ alter: true })
    .then(async () => {
        await insertNumbers();
        await seedCommissionConfigs(); // Cargar comisiones por defecto si no existen
        
        app.listen(PORT, () => {
            console.log(`🚀 Server listening on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Error syncing the database:", error);
    });