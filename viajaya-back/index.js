const app = require("./src/app.js")
const {conn} = require("./src/db.js")

const insertNumbers = require('./src/scripts/InsertNumbers.js')
const assignInitialRoles = require('./src/scripts/assignInitialRoles.js')

conn.sync({ force: true })
    .then(async () => {
        await insertNumbers();
        await assignInitialRoles(); // Verificar/crear usuarios con roles
        
        app.listen(3001, () => {
            console.log("🚀 Server listening on port 3001");
            console.log("🔐 Sistema de roles configurado");
            console.log("📊 Roles disponibles:");
            console.log("   1: Cliente");
            console.log("   2: Asesor");  
            console.log("   3: Líder");
            console.log("   4: Gerente");
            console.log("   5: Admin");
            console.log("   6: Contador");
            console.log("   7: Owner");
            console.log("👤 Usuarios de prueba:");
            console.log("   Admin: admin@viajaya.com / Admin123!");
            console.log("   Owner: owner@viajaya.com / Owner123!");
        });
    })
    .catch((error) => {
        console.error("Error syncing the database:", error);
    });