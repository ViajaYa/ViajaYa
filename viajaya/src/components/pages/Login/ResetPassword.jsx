import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      return toast.error("La contraseña debe tener al menos 8 caracteres");
    }
    if (password !== password2) {
      return toast.error("Las contraseñas no coinciden");
    }
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/user/reset-password-link`, {
        token,
        newPassword: password,
      });
      toast.success("Contraseña actualizada. Ahora puedes iniciar sesión.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al actualizar contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div className="p-8 text-center text-red-600">Token inválido o faltante.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <Toaster />
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Restablecer contraseña</h2>
        <input
          type="password"
          placeholder="Nueva contraseña"
          className="w-full mb-3 p-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Repetir contraseña"
          className="w-full mb-3 p-2 border rounded"
          value={password2}
          onChange={e => setPassword2(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;