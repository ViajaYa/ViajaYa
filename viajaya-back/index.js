const app = require("./src/app.js")
const {conn} = require("./src/db.js")

const insertNumbers = require('./src/scripts/InsertNumbers.js')
const assignInitialRoles = require('./src/scripts/assignInitialRoles.js')
const seedCommissionConfigs = require('./src/seedCommissionConfigs.js')

// Define puerto - AWS Elastic Beanstalk proporcionará PORT en la variable de entorno
const PORT = process.env.PORT || 3001;

conn.sync({ alter: true })
    .then(async () => {
        await insertNumbers();
        await assignInitialRoles(); // Verificar/crear usuarios con roles
        await seedCommissionConfigs(); // Cargar comisiones por defecto si no existen
        
        app.listen(PORT, () => {
            console.log(`🚀 Server listening on port ${PORT}`);
            // console.log("🔐 Sistema de roles configurado");
            // console.log("📊 Roles disponibles:");
            // console.log("   1: Cliente");
            // console.log("   2: Asesor");  
            // console.log("   3: Líder");
            // console.log("   4: Gerente");
            // console.log("   5: Admin");
            // console.log("   6: Contador");
            // console.log("   7: Owner");
            // console.log("👤 Usuarios de prueba:");
            // console.log("   Admin: admin@viajaya.com / Admin123!");
            // console.log("   Owner: owner@viajaya.com / Owner123!");
        });
    })
    .catch((error) => {
        console.error("Error syncing the database:", error);
    });

    //probando coemntario para deploy