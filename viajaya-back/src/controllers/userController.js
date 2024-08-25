const {User} = require("../db")
const jwt = require("jsonwebtoken")

module.exports = {
    getUsers: async () => {
        const users = await User.findAll()
        return users
    },
    putUser: async (u) => {
        try {
            const user = await User.findOne({
                where: { id: u.id }
            });
    
            if (!user) {
                throw new Error("Usuario no encontrado");
            }
    
            // Actualiza solo los campos que están definidos en `u`
            const fieldsToUpdate = [ 'email', 'phone',  'role', 'image', 'points', 'referredBy'];
            fieldsToUpdate.forEach(field => {
                if (u[field] !== undefined) {
                    user[field] = u[field];
                }
            });
    
            await user.save();
            return "Usuario actualizado";
        } catch (error) {
            console.error('Error al actualizar el usuario:', error);
            return `Error: ${error.message}`;
        }
    },
    
    postUser: async (user) => {
        const existingUser = await User.findOne({
            where: {
                email: user.email
            }
        });
        if(existingUser){
            throw Error("Email existente")
        }if(user.referral_code) {
            const referringUser = await User.findOne({
                where: {
                    referral_code: user.referral_code
                }
            });

            if (referringUser) {
                // Si el código de referido es válido, asigna el código de referido del usuario
                user.referred_by = referringUser.referral_code;
            } else {
                // Si el código de referido no es válido, puedes manejar el error si es necesario
                throw Error("Código de referido inválido");
            }
        }

        // Crea el nuevo usuario
        await User.create(user);
        return "Usuario creado con éxito";
    },
    recoveryPass: async (email) => {
        const user = await User.findOne({
            where:{
                email:email
            }
        })
        return user
    },
    deleteUser:  async (id) => {
        try {
            const user = await User.findOne({
                where: {
                    id: id
                }
            });
    
            if (user) {
                await user.destroy();
                return "Usuario eliminado con éxito";
            } else {
                return null; // Cambié esto para que retorne null si el usuario no existe
            }
        } catch (error) {
            throw new Error("Error al eliminar el usuario");
        }
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