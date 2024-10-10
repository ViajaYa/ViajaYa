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
    
            // Define los campos que pueden ser actualizados
            const fieldsToUpdate = [
                'name', 'lastname', 'email', 'phone', 'password', 'role', 'image', 'points', 'referredBy'
            ];
    
            // Actualiza solo los campos que están definidos en u
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
        // Verifica si el email ya existe
        const existingUser = await User.findOne({
            where: {
                email: user.email
            }
        });
        if (existingUser) {
            throw new Error("Email existente");
        }
    
        // Verifica si hay un código de referido
        if (user.referral_code) {
            const referringUser = await User.findOne({
                where: {
                    referral_code: user.referral_code
                }
            });
    
            if (referringUser) {
                // Si el código de referido es válido, asigna el ID del usuario que refiere
                user.referred_by = referringUser.referral_code; // Asegúrate de usar el campo correcto
            } else {
                // Si el código de referido no es válido, lanza un error
                throw new Error("Código de referido inválido");
            }
        }
    
        // Crea el nuevo usuario
        const newUser = await User.create(user);
        return { message: "Usuario creado con éxito", user: newUser };

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