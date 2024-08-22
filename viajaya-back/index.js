const app = require("./src/app.js")
const {conn} = require("./src/db.js")
const {Promo, Char} = require("./src/db.js")

conn.sync({alter:true}).then(() =>{
    app.listen(3001, () => {
        Char.findOrCreate(  {where:{name:"Wifi"}})
        Char.findOrCreate( {where:{name:"Parqueadero"}})
        Char.findOrCreate( {where:{name:"Piscina"}})
        Char.findOrCreate( {where:{name:"Jacuzzi"}})
        Char.findOrCreate( {where:{name:"Cama Doble"}})
        Char.findOrCreate( {where:{name:"Gimnasio"}})
        Promo.create({
            price:10000,
            title:"Mi promo",
            details:"Texto de ejemplo",
            fechas:[],
            days:0,
            image:"https://res.cloudinary.com/dftvenl2z/image/upload/v1687911328/viajaya/a2j4izia5ziz882fdrfx.jpg"
        })
        console.log("Server listening on port 3001")
    })
})
