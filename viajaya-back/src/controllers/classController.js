const {Class} = require("../db")

module.exports = {
    getClass: async () => {
        const clases = await Class.findAll()
        return clases
    },
    putClass: async (clas) => {
        const clase = await Class.findOne({
            where:{
                id:clas.id
            }
        })
        if(clase){
            if(clas.title) clase.title = clas.title
            if(clas.link) clase.link = clas.link
            if(clas.status) clase.status = !clase.status
            await clase.save()
            return "Clase actualizado"
        }else return "No lo encontramos"
    },
    postClass: async (clase) => {
        await Class.create(clase)
        return "Clase creado con exito"
    },
    deleteClass: async (id) => {
        const clase = await Class.findOne({
            where:{
                id:id
            }
        })
        if(clase){
            await clase.destroy()
            return "Clase eliminada"
        }else return "No encontramos el usuario"
    }
}