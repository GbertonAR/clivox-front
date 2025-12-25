import React, { useState } from "react";

const Register: React.FC = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCodigo, setLoadingCodigo] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");

    try {
      const response = await fetch("/api/registrar-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("Usuario registrado con éxito. Ahora podés iniciar sesión.");
        setCodigoEnviado(false);
        setNombre("");
        setEmail("");
      } else {
        setMensaje(data.detail || "Error al registrar usuario.");
      }
    } catch (error) {
      setMensaje("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para enviar código de validación
  const enviarCodigoValidacion = async () => {
    if (!email) {
      setMensaje("Por favor ingresá un email válido para enviar el código.");
      return;
    }

    setLoadingCodigo(true);
    setMensaje("");

    try {
      const res = await fetch("/api/validar-mail-post-registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje("Código de validación enviado a tu correo.");
        setCodigoEnviado(true);
      } else {
        setMensaje(data.detail || "Error al enviar código de validación.");
      }
    } catch {
      setMensaje("Error de conexión al enviar código.");
    } finally {
      setLoadingCodigo(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-xl p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">Registro</h2>

        <label className="block mb-2 font-medium">Nombre completo:</label>
        <input
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="mb-4 w-full px-4 py-2 border rounded-lg"
        />

        <label className="block mb-2 font-medium">Correo electrónico:</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-6 w-full px-4 py-2 border rounded-lg"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>

        {/* Botón para enviar código de validación */}
        <button
          type="button"
          onClick={enviarCodigoValidacion}
          disabled={loadingCodigo || !email}
          className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
        >
          {loadingCodigo ? "Enviando código..." : "Enviar código de validación"}
        </button>

        {mensaje && (
          <p className="mt-4 text-center text-sm text-gray-700">{mensaje}</p>
        )}
      </form>
    </div>
  );
};

export default Register;
