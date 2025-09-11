const app = require("./src/app.js")
const {conn} = require("./src/db.js")

const insertNumbers = require('./src/scripts/InsertNumbers.js')
const seedCommissionConfigs = require('./src/seedCommissionConfigs.js')

// Define puerto - AWS Elastic Beanstalk proporcionará PORT en la variable de entorno
const PORT = process.env.PORT || 3001;

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