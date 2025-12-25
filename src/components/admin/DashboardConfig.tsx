import React, { useEffect, useState } from "react";
import CrudManager from "./CrudManager";

type Registro = { [key: string]: any };

const DashboardConfig: React.FC = () => {
  const [tablas, setTablas] = useState<string[]>([]);
  const [tablaSeleccionada, setTablaSeleccionada] = useState<string>("");
  const [datos, setDatos] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTablas = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/admin_crud/tables");

      if (!res.ok) {
        const errorText = await res.clone().text();
        throw new Error(`Error HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log("Tablas disponibles:", data);
      setTablas(data);

      if (data.length > 0) {
        setTablaSeleccionada(data[0]);
      }
    } catch (e) {
      console.error("Error al cargar tablas:", e);
      alert("No se pudieron cargar las tablas.");
    }
  };

  const fetchDatos = async () => {
    if (!tablaSeleccionada) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/admin_crud/data/${tablaSeleccionada}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDatos(data);
    } catch (e: any) {
      console.error("Error al cargar datos:", e);
      alert("Error al cargar datos: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablas();
  }, []);

  useEffect(() => {
    fetchDatos();
  }, [tablaSeleccionada]);

  return (
    <div className="min-h-screen p-10 bg-gradient-to-br from-blue-900 to-purple-800 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">
        ⚙️ Panel de Configuración General
      </h1>

      <select
        value={tablaSeleccionada}
        onChange={(e) => setTablaSeleccionada(e.target.value)}
        className="border p-2 rounded mb-6 text-black"
      >
        {tablas.map((tabla) => (
          <option key={tabla} value={tabla}>
            {tabla}
          </option>
        ))}
      </select>

      {loading ? (
        <p className="text-center">Cargando...</p>
      ) : (
        <div className="overflow-x-auto bg-white text-black rounded shadow">
          <table className="table-auto border-collapse border border-gray-400 w-full">
            <thead>
              <tr>
                {datos[0] &&
                  Object.keys(datos[0]).map((col) => (
                    <th
                      key={col}
                      className="border border-gray-300 px-2 py-1 bg-gray-100 text-left"
                    >
                      {col}
                    </th>
                  ))}
                <th className="border border-gray-300 px-2 py-1 bg-gray-100">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {datos.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {Object.keys(row).map((col) => (
                    <td key={col} className="border border-gray-300 px-2 py-1">
                      {row[col]}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-2 py-1">
                    <button className="mr-2 text-blue-600 hover:underline">
                      Editar
                    </button>
                    <button className="text-red-600 hover:underline">
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10">
        {tablaSeleccionada && <CrudManager tablaActual={tablaSeleccionada} />}
      </div>
    </div>
  );
};

export default DashboardConfig;
