import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false); // Nuevo estado
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
      const msg = err.response?.data?.message || "Error al actualizar contraseña";
      toast.error(msg);
      // Si el error es por token inválido, muestra el formulario de reenvío
      if (msg.toLowerCase().includes("token")) {
        setInvalidToken(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail || !resendEmail.includes("@")) {
      return toast.error("Ingresa un email válido");
    }
    setResending(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:3001"}/user/resend-activation-link`, {
        email: resendEmail,
      });
      toast.success("Si el email existe, se envió un nuevo enlace.");
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo reenviar el enlace");
    } finally {
      setResending(false);
    }
  };

  // Mostrar formulario de reenvío si no hay token o si el token es inválido
  if (!token || invalidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <Toaster />
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="text-red-600 mb-4">Token inválido o expirado.</div>
          <h2 className="text-xl font-bold mb-2">¿No recibiste el enlace?</h2>
          <form onSubmit={handleResend}>
            <input
              type="email"
              placeholder="Tu email"
              className="w-full mb-3 p-2 border rounded"
              value={resendEmail}
              onChange={e => setResendEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
              disabled={resending}
            >
              {resending ? "Enviando..." : "Reenviar enlace"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Si el token es válido, muestra el formulario de cambio de contraseña
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