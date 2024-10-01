const app = require("./src/app.js")
const {conn} = require("./src/db.js")
const {Promo, Char} = require("./src/db.js")

conn.sync({ force :true }).then(() =>{
    app.listen(3001, () => {
        
        console.log("Server listening on port 3001")
    })
})
