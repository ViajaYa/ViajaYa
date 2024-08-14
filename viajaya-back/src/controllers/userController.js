const {User} = require("../db")
const jwt = require("jsonwebtoken")

module.exports = {
    getUsers: async () => {
        const users = await User.findAll()
        return users
    },
    putUser: async (u) => {
        const user = await User.findOne({
            where:{
                id:u.id
            }
        })
        if(user){
            if(u.name) user.name = u.name
            if(u.lastname) user.lastname = u.lastname
            if(u.email) user.email = u.email
            if(u.phone) user.phone = u.phone
            if(u.password) user.password = u.password
            if(u.role) user.role = u.role
            if(u.image) user.image = u.image
            await user.save()
            return "Usuario actualizado"
        }else return "No lo encontramos"
    },
    postUser: async (user) => {
        const userr = await User.findOne({
            where:{
                email:user.email
            }
        })
        if(userr){
            throw Error("Email existente")
        }else{
        await User.create(user)
        return "Usuario creado con exito"
        }
    },
    recoveryPass: async (email) => {
        const user = await User.findOne({
            where:{
                email:email
            }
        })
        return user
    },
    deleteUser: async (id) => {
        const user = await User.findOne({
            where:{
                id:id
            }
        })
        if(user){
            await user.destroy()
            return "Usuario eliminado con exito"
        }else return "No encontramos el usuario"
    },
    authUser: async ({email,password}) => {
        const user = await User.findOne({
            where:{
                email:email,
                password:password
            }
        })
        if(user){
            const token = jwt.sign({name:user.name,email:user.email, id:user.id}, 'shhhhh');
            return {message:true, id:user.id, token}
        }else return {message:false}
    },
    getUserById: async (id) => {
        const user = await User.findOne({
            where:{
                id:id
            }
        })
        return user
    },
    verifyToken: async (token) => {
        const decoded = jwt.verify(token, 'shhhhh');
        return decoded
    }
}