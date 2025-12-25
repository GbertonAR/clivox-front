// src/pages/AdminDashboard.tsx
import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

const colors = ["#6a11cb", "#2575fc", "#00c9ff", "#00ff95"]

const AdminDashboard = () => {
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/dashboard/stats`)
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error("Error al obtener estadísticas:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div style={{ padding: 40, fontSize: 18 }}>🔄 Cargando estadísticas...</div>
  }

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 28, marginBottom: 30 }}>📊 Panel de Administración</h1>

      <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <h2>Eventos por tipo</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.eventos}>
              <XAxis dataKey="evento" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#6a11cb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, minWidth: 300 }}>
          <h2>Llamadas por sala</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.llamadas}
                dataKey="cantidad"
                nameKey="sala_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {stats.llamadas.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
