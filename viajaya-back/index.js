const app = require("./src/app.js")
const {conn} = require("./src/db.js")

const insertNumbers  = require  ('./src/scripts/InsertNumbers.js')


conn.sync({ alter : true })
    .then(async () => {
        await insertNumbers();
        app.listen(3001, () => {
            console.log("Server listening on port 3001");
        });

    })
    .catch((error) => {
        console.error("Error syncing the database:", error);
    });

