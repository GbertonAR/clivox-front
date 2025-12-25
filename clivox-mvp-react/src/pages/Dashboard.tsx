import { Button } from '@/components/ui/button'

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-card p-6 rounded-2xl shadow-xl border space-y-4 text-center">
        <h2 className="text-3xl font-bold text-primary">🎉 Sesión finalizada</h2>
        <p className="text-muted-foreground">Gracias por utilizar Clivox Instructor.</p>
        <Button onClick={() => window.location.href = '/'}>🏠 Volver al inicio</Button>
      </div>
    </div>
  )
}

export default Dashboard
