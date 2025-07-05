// src/pages/Instructor.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { Video, VideoOff, Mic, MicOff, VideoIcon } from 'lucide-react'

const Instructor = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [salaId, setSalaId] = useState('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const peers = useRef<Record<string, RTCPeerConnection>>({})
  const localStream = useRef<MediaStream | null>(null)
  const navigate = useNavigate()

  const [camaraActiva, setCamaraActiva] = useState(true)
  const [microfonoActivo, setMicrofonoActivo] = useState(true)

  const [sesionIniciada, setSesionIniciada] = useState(false)
  const [horaSesion, setHoraSesion] = useState<string | null>(null)

  const [fechaHora, setFechaHora] = useState(new Date().toLocaleString())

  useEffect(() => {
    const interval = setInterval(() => {
      setFechaHora(new Date().toLocaleString())
    }, 1000) // actualiza cada 1 segundo

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream
      localStream.current = stream
      setCamaraActiva(true)
      setMicrofonoActivo(true)
    }).catch(() => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo acceder a la cámara o micrófono.',
      })
    })

    return () => finalizarSesion(false)
  }, [])

// const iniciarConexion = () => {
//   if (!salaId) return
//   const backendUrl = import.meta.env.VITE_API_WS_URL || "ws://localhost:8000"
//   // const socket = new WebSocket(`${backendUrl}/ws/instructor/${salaId}`)
//   const instructorId = "instructor1" // podés obtenerlo dinámicamente si querés
//   const ws = new WebSocket(`${backendUrl}/ws/instructor/${salaId}/${instructorId}`)


//   setWs(ws)

//   ws.onmessage = async (event) => {
//     const [type, clientId, payload] = event.data.split('::')

//     if (type === 'NEW_CLIENT') {
//       await crearConexion(clientId, ws)
      
//     } else if (type === 'ANSWER') {
//       const desc = new RTCSessionDescription(JSON.parse(payload))
//       await peers.current[clientId]?.setRemoteDescription(desc)
//     } else if (type === 'ICE') {
//       const candidate = new RTCIceCandidate(JSON.parse(payload))
//       await peers.current[clientId]?.addIceCandidate(candidate)
//     }
//   }
// }

const iniciarConexion = () => {
  if (!salaId) return

  if (ws && ws.readyState === WebSocket.OPEN) {
    toast({
      title: 'Conexión ya abierta',
      description: 'Ya estás conectado a una sala.',
    })
    return
  }

  const backendUrl = import.meta.env.VITE_API_WS_URL || "ws://localhost:8000"
  const instructorId = "instructor1" // podés obtenerlo dinámicamente si querés
  const newWs = new WebSocket(`${backendUrl}/ws/instructor/${salaId}/${instructorId}`)

  setWs(newWs)

  newWs.onopen = () => {
    toast({
      title: 'Conexión establecida',
      description: `Conectado a la sala ${salaId}`,
    })
    setSesionIniciada(true)
    setHoraSesion(new Date().toLocaleTimeString())
  }

  newWs.onmessage = async (event) => {
    const [type, clientId, payload] = event.data.split('::')

    if (type === 'NEW_CLIENT') {
      await crearConexion(clientId, newWs)
      
    } else if (type === 'ANSWER') {
      const desc = new RTCSessionDescription(JSON.parse(payload))
      await peers.current[clientId]?.setRemoteDescription(desc)
    } else if (type === 'ICE') {
      const candidate = new RTCIceCandidate(JSON.parse(payload))
      await peers.current[clientId]?.addIceCandidate(candidate)
    }
  }

  newWs.onclose = () => {
    toast({
      title: 'Conexión cerrada',
      description: 'La conexión WebSocket se ha cerrado.',
    })
    setWs(null)
  }

  newWs.onerror = (error) => {
    toast({
      variant: 'destructive',
      title: 'Error de conexión',
      description: 'Ocurrió un error con la conexión WebSocket.',
    })
  }
}


  const crearConexion = async (clientId: string, ws: WebSocket) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    peers.current[clientId] = pc

    localStream.current?.getTracks().forEach((track) => pc.addTrack(track, localStream.current!))

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(`ICE::${clientId}::${JSON.stringify(event.candidate)}`)
      }
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    ws.send(`OFFER::${clientId}::${JSON.stringify(offer)}`)
  }

  const finalizarSesion = (redirigir = true) => {
    localStream.current?.getTracks().forEach((track) => track.stop())
    localStream.current = null

    Object.values(peers.current).forEach((pc) => pc.close())
    peers.current = {}

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
    setWs(null)

    if (videoRef.current) videoRef.current.srcObject = null

    toast({
      title: "Sesión finalizada",
      description: "Se cerró la conexión correctamente.",
    })

    if (redirigir) {
      setTimeout(() => navigate('/dashboard'), 1500)
    }
    setSesionIniciada(false)
    setHoraSesion(null)
  }

  const toggleCamara = () => {
    if (!localStream.current) return
    localStream.current.getVideoTracks().forEach((track) => {
      track.enabled = !camaraActiva
    })
    setCamaraActiva(!camaraActiva)
  }

  const toggleMicrofono = () => {
    if (!localStream.current) return
    localStream.current.getAudioTracks().forEach((track) => {
      track.enabled = !microfonoActivo
    })
    setMicrofonoActivo(!microfonoActivo)
  }

  return (
    // <div className="min-h-screen bg-gradient-to-b from-white to-slate-100 p-6 flex items-center justify-center">
    <div className="min-h-screen bg-gradient-to-br from-[#6a11cb] to-[#2575fc] p-6 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl space-y-6">
        <h1 className="text-4xl font-bold text-center text-slate-800 flex items-center justify-center gap-2">
          🎓 <span>Modo Instructor</span>
        </h1>

        {sesionIniciada && (
          <p className="text-green-400 text-center text-sm font-semibold mt-[-10px]">
            ✅ Sesión iniciada a las {horaSesion}
          </p>
        )}

        <input
          type="text"
          placeholder="🎯 ID de la sala"
          value={salaId}
          onChange={(e) => setSalaId(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={iniciarConexion}
            className={`gap-2 ${sesionIniciada ? 'bg-green-600 hover:bg-green-700' : ''}`}
            disabled={sesionIniciada}
          >
            {sesionIniciada ? '✅ Sesión Iniciada' : '🔴 Iniciar sesión en sala'}
          </Button>

          <Button variant="secondary" onClick={toggleCamara} className="gap-2">
            {camaraActiva ? <VideoOff size={18} /> : <Video size={18} />}
            {camaraActiva ? 'Apagar Cámara' : 'Prender Cámara'}
          </Button>

          <Button variant="secondary" onClick={toggleMicrofono} className="gap-2">
            {microfonoActivo ? <MicOff size={18} /> : <Mic size={18} />}
            {microfonoActivo ? 'Apagar Micrófono' : 'Prender Micrófono'}
          </Button>
        </div>

        <div className="flex justify-center">
          <Button variant="destructive" onClick={() => finalizarSesion(true)} className="px-6">
            ⛔ Finalizar sesión
          </Button>
        </div>

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-lg border border-slate-200 shadow-md"
        />

        <div className="text-center text-sm text-slate-500 pt-6">
          <hr className="my-4 border-slate-300" />
          <p>🧪 Versión Beta 1.0 — {fechaHora}</p>
        </div>


      </div>
    </div>
  )
}

export default Instructor
