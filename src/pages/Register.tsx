import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

interface FieldErrors {
  nombre?: string;
  apellido?: string;
  fecha?: string;
  nickname?: string;
}

const onlyLetters = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const alphanumOnly = /^[a-zA-Z0-9]+$/;

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [fecha, setFecha] = useState("");
  const [nickname, setNickname] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};

    if (!nombre.trim()) e.nombre = "El nombre es obligatorio.";
    else if (nombre.trim().length < 2) e.nombre = "Mínimo 2 caracteres.";
    else if (!onlyLetters.test(nombre.trim())) e.nombre = "Solo letras.";

    if (!apellido.trim()) e.apellido = "El apellido es obligatorio.";
    else if (apellido.trim().length < 2) e.apellido = "Mínimo 2 caracteres.";
    else if (!onlyLetters.test(apellido.trim())) e.apellido = "Solo letras.";

    if (!fecha) e.fecha = "La fecha es obligatoria.";
    else {
      const d = new Date(fecha);
      const today = new Date();
      if (isNaN(d.getTime())) e.fecha = "Fecha inválida.";
      else if (d > today) e.fecha = "No puede ser futura.";
      else {
        const age = today.getFullYear() - d.getFullYear() -
          (today.getMonth() < d.getMonth() ||
          (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())
            ? 1
            : 0);
        if (age < 18) e.fecha = "Tenés que ser mayor de 18 años.";
        if (age > 120) e.fecha = "Fecha poco probable.";
      }
    }

    if (!nickname.trim()) e.nickname = "El nickname es obligatorio.";
    else if (nickname.trim().length < 3) e.nickname = "Mínimo 3 caracteres.";
    else if (nickname.trim().length > 20) e.nickname = "Máximo 20 caracteres.";
    else if (!alphanumOnly.test(nickname.trim()))
      e.nickname = "Solo letras y números, sin espacios.";

    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setOk(null);
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setLoading(true);
    try {
      // Solo se envía el nickname al backend. Nombre/apellido/fecha son mock client-side.
      const user = await api.createUser(nickname.trim());
      setOk("Cuenta creada. Te logueamos...");
      login(user);
      setTimeout(() => navigate("/"), 600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo crear el usuario";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Crear cuenta</h1>
        <p className="muted">
          Contraseña para todos: <code>123456</code>.
        </p>

        <label>Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Juan"
          autoComplete="given-name"
          className={errors.nombre ? "input-error" : ""}
        />
        {errors.nombre && <span className="field-error">{errors.nombre}</span>}

        <label>Apellido</label>
        <input
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          placeholder="Pérez"
          autoComplete="family-name"
          className={errors.apellido ? "input-error" : ""}
        />
        {errors.apellido && <span className="field-error">{errors.apellido}</span>}

        <label>Fecha de nacimiento</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className={errors.fecha ? "input-error" : ""}
        />
        {errors.fecha && <span className="field-error">{errors.fecha}</span>}

        <label>Nickname</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="elnick"
          maxLength={20}
          autoComplete="username"
          className={errors.nickname ? "input-error" : ""}
        />
        {errors.nickname && <span className="field-error">{errors.nickname}</span>}

        {serverError && <div className="alert alert-error">{serverError}</div>}
        {ok && <div className="alert alert-ok">{ok}</div>}

        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Creando..." : "Registrarme"}
        </button>

        <p className="muted center">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </form>
    </div>
  );
}
