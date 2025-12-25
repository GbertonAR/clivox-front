import React, { useEffect, useState } from "react";

interface Column {
  name: string;
  type: string;
  pk: boolean;
}

interface Props {
  tablaActual: string;
}

const BACKEND_URL = "http://localhost:8000";

const CrudManager: React.FC<Props> = ({ tablaActual }) => {
  const [columnas, setColumnas] = useState<Column[]>([]);
  const [datos, setDatos] = useState<any[]>([]);
  const [nuevoRegistro, setNuevoRegistro] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!tablaActual) return;

    const fetchSchemaYDatos = async () => {
      try {
        // URLs con guion bajo 'admin_crud'
        const resCols = await fetch(`${BACKEND_URL}/api/admin_crud/schema/${tablaActual}`);
        if (!resCols.ok) throw new Error(`Error al obtener columnas (${resCols.status})`);
        const cols = await resCols.json();
        setColumnas(cols);

        const inicial = cols.reduce((acc: any, col: Column) => {
          acc[col.name] = "";
          return acc;
        }, {});
        setNuevoRegistro(inicial);

        const resDatos = await fetch(`${BACKEND_URL}/api/admin_crud/data/${tablaActual}`);
        if (!resDatos.ok) throw new Error(`Error al obtener datos (${resDatos.status})`);
        const data = await resDatos.json();
        setDatos(data);
      } catch (err) {
        console.error("Error en carga inicial:", err);
        alert("Error al cargar estructura y datos.");
      }
    };

    fetchSchemaYDatos();
  }, [tablaActual]);

  const handleCrear = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin_crud/data/${tablaActual}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoRegistro),
      });

      if (!res.ok) {
        const errText = await res.clone().text();
        throw new Error(`Error al crear registro (${res.status}): ${errText}`);
      }

      alert("Registro creado con éxito");

      const nuevos = await fetch(`${BACKEND_URL}/api/admin_crud/data/${tablaActual}`);
      if (!nuevos.ok) throw new Error("Error al recargar datos.");
      const data = await nuevos.json();
      setDatos(data);
    } catch (err) {
      console.error("Error al crear:", err);
      alert("Error al crear registro.");
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar este registro?")) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin_crud/data/${tablaActual}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`Error al eliminar (HTTP ${res.status})`);

      const nuevos = await fetch(`${BACKEND_URL}/api/admin_crud/data/${tablaActual}`);
      if (!nuevos.ok) throw new Error("Error al recargar datos.");
      const data = await nuevos.json();
      setDatos(data);
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert("No se pudo eliminar el registro.");
    }
  };

  if (!tablaActual) return null;

  return (
    <div className="p-6 bg-white bg-opacity-10 backdrop-blur-md text-white rounded-3xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🧩 CRUD Dinámico</h2>

      <h3 className="text-xl font-semibold mb-2">➕ Nuevo registro</h3>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        {columnas
          .filter((col) => !col.pk)
          .map((col) => (
            <input
              key={col.name}
              type="text"
              placeholder={col.name}
              value={nuevoRegistro[col.name]}
              onChange={(e) =>
                setNuevoRegistro({
                  ...nuevoRegistro,
                  [col.name]: e.target.value,
                })
              }
              className="p-2 rounded text-black"
            />
          ))}
      </div>
      <button
        onClick={handleCrear}
        className="bg-green-600 px-4 py-2 rounded-lg mb-6 hover:bg-green-700"
      >
        Crear
      </button>

      <h3 className="text-xl font-semibold mb-2">📋 Registros</h3>
      <div className="overflow-auto max-h-[400px] bg-white bg-opacity-10 p-2 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columnas.map((col) => (
                <th key={col.name} className="border-b p-2">
                  {col.name}
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {datos.map((fila, idx) => (
              <tr key={idx} className="hover:bg-white/10">
                {columnas.map((col) => (
                  <td key={col.name} className="p-2 border-b">
                    {fila[col.name]}
                  </td>
                ))}
                <td>
                  <button
                    onClick={() => handleEliminar(fila.ID)}
                    className="bg-red-600 px-2 py-1 rounded text-white hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CrudManager;
