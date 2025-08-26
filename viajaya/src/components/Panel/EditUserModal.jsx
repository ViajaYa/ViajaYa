/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React from "react";

const tiposDocumento = [
  { value: "cc", label: "Cédula de ciudadanía" },
  { value: "ce", label: "Cédula de extranjería" },
  { value: "ti", label: "Tarjeta de identidad" },
  { value: "rc", label: "Registro civil" },
  { value: "passport", label: "Pasaporte" },
  { value: "pep", label: "PEP" },
  { value: "ppt", label: "PPT" },
  { value: "nit", label: "NIT" },
  { value: "nuip", label: "NUIP" },
  { value: "dni", label: "DNI" },
  { value: "salvoconducto", label: "Salvoconducto" },
  { value: "cedula_diplomatica", label: "Cédula diplomática" },
];

const EditUserModal = ({
  user,
  leaders,
  managers,
  onChange,
  onSave,
  onCancel,
  loading
}) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">Editar Usuario</h2>
        <div className="grid grid-cols-1 gap-4">
          <input name="name" value={user.name || ""} onChange={onChange} placeholder="Nombre" className="p-2 border rounded" />
          <input name="lastname" value={user.lastname || ""} onChange={onChange} placeholder="Apellido" className="p-2 border rounded" />
          <input name="email" value={user.email || ""} onChange={onChange} placeholder="Email" className="p-2 border rounded" />
          <input name="phone" value={user.phone || ""} onChange={onChange} placeholder="Teléfono" className="p-2 border rounded" />
          <input name="image" value={user.image || ""} onChange={onChange} placeholder="URL de imagen" className="p-2 border rounded" />
          <input name="fecha_nacimiento" type="date" value={user.fecha_nacimiento ? user.fecha_nacimiento.slice(0,10) : ""} onChange={onChange} placeholder="Fecha de nacimiento" className="p-2 border rounded" />
          <select name="tipo_documento" value={user.tipo_documento || ""} onChange={onChange} className="p-2 border rounded">
            <option value="">Tipo de documento</option>
            {tiposDocumento.map(td => (
              <option key={td.value} value={td.value}>{td.label}</option>
            ))}
          </select>
          <input name="documento_identidad" value={user.documento_identidad || ""} onChange={onChange} placeholder="Número de documento" className="p-2 border rounded" />
          <input name="direccion" value={user.direccion || ""} onChange={onChange} placeholder="Dirección" className="p-2 border rounded" />
          <input name="ciudad" value={user.ciudad || ""} onChange={onChange} placeholder="Ciudad" className="p-2 border rounded" />
          <input name="pais" value={user.pais || ""} onChange={onChange} placeholder="País" className="p-2 border rounded" />

          {/* Jerarquía */}
          <select name="role" value={user.role} onChange={onChange} className="p-2 border rounded">
            <option value={1}>Cliente</option>
            <option value={2}>Asesor</option>
            <option value={3}>Líder</option>
            <option value={4}>Gerente</option>
            <option value={5}>Admin</option>
            <option value={6}>Contador</option>
            <option value={7}>Owner</option>
          </select>
          {user.role === 2 && (
            <select name="lider_id" value={user.lider_id || ""} onChange={onChange} className="p-2 border rounded">
              <option value="">Selecciona un líder</option>
              {leaders.map(l => (
                <option key={l.id} value={l.id}>{l.name} {l.lastname}</option>
              ))}
            </select>
          )}
          {user.role === 3 && (
            <select name="gerente_id" value={user.gerente_id || ""} onChange={onChange} className="p-2 border rounded">
              <option value="">Selecciona un gerente</option>
              {managers.map(g => (
                <option key={g.id} value={g.id}>{g.name} {g.lastname}</option>
              ))}
            </select>
          )}

          {/* Bancarios */}
          <input name="banco" value={user.banco || ""} onChange={onChange} placeholder="Banco" className="p-2 border rounded" />
          <input name="numero_cuenta" value={user.numero_cuenta || ""} onChange={onChange} placeholder="Número de cuenta" className="p-2 border rounded" />
          <select name="tipo_cuenta" value={user.tipo_cuenta || ""} onChange={onChange} className="p-2 border rounded">
            <option value="">Tipo de cuenta</option>
            <option value="ahorros">Ahorros</option>
            <option value="corriente">Corriente</option>
          </select>
          <input name="nombre_titular" value={user.nombre_titular || ""} onChange={onChange} placeholder="Nombre del titular" className="p-2 border rounded" />
          <input name="documento_titular" value={user.documento_titular || ""} onChange={onChange} placeholder="Documento del titular" className="p-2 border rounded" />

          {/* Estado y seguridad */}
          <div className="flex items-center gap-2">
            <label className="font-medium">¿Usuario activo?</label>
            <input
              type="checkbox"
              name="is_active"
              checked={!!user.is_active}
              onChange={e => onChange({ target: { name: "is_active", value: e.target.checked } })}
              className="ml-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium">¿Vendedor activo?</label>
            <input
              type="checkbox"
              name="is_active_seller"
              checked={!!user.is_active_seller}
              onChange={e => onChange({ target: { name: "is_active_seller", value: e.target.checked } })}
              className="ml-2"
            />
          </div>
          <input name="fecha_ingreso" type="date" value={user.fecha_ingreso ? user.fecha_ingreso.slice(0,10) : ""} onChange={onChange} placeholder="Fecha de ingreso" className="p-2 border rounded" />
          <input name="points" type="number" value={user.points || 0} onChange={onChange} placeholder="Puntos" className="p-2 border rounded" />
          <input name="commission_limit" type="number" value={user.commission_limit || ""} onChange={onChange} placeholder="Límite comisión" className="p-2 border rounded" />
          <input name="current_commission_used" type="number" value={user.current_commission_used || ""} onChange={onChange} placeholder="Comisión usada actual" className="p-2 border rounded" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
          <button onClick={onSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;