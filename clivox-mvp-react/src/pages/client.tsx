import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  User,
  Wifi,
  PlugZap,
  Plug2,
  XCircle,
} from 'lucide-react'

const Client = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [salaId, setSalaId] = useState('')
  const [userId, setUserId] = useState('')
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const [camaraActiva, setCamaraActiva] = useState(true)
  const [microfonoActivo, setMicrofonoActivo] = useState(true)
  const [conectado, setConectado] = useState(false)
  const [conectando, setConectando] = useState(false)

  const iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

  const enviarMensaje = (mensaje: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(mensaje)
    } else {
      console.warn('⚠️ WebSocket no está listo para enviar mensajes.')
    }
  }

  const conectar = async () => {
    if (!salaId || !userId) {
      toast({
        variant: 'destructive',
        title: 'Faltan datos',
        description: 'Ingresá el ID de sala y tu nombre.',
      })
      return
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      toast({ title: 'Ya estás conectado a una sala.' })
      return
    }

    setConectando(true)


    const socketUrl = `wss://clivox-backend-cea4bzfcahbpf9fw.westus-01.azurewebsites.net/ws/cliente/${salaId}/${userId}`
    console.log("🌐 Intentando conexión WebSocket a:", socketUrl)
    const ws = new WebSocket(socketUrl)

    // const wsUrl = `wss://clivox-backend-cea4bzfcahbpf9fw.westus-01.azurewebsites.net/ws/cliente/${salaId}/${userId}`
    // const ws = new WebSocket(wsUrl)
    // wsRef.current = ws

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Acceso denegado',
        description: 'No se pudo acceder a cámara o micrófono.',
      })
      setConectando(false)
      return
    }

    ws.onopen = () => {
      setConectado(true)
      setConectando(false)
      toast({ title: '✅ Conectado', description: `Te uniste a la sala ${salaId}` })
    }

    ws.onclose = () => {
      setConectado(false)
      wsRef.current = null
      // Cerrar y limpiar conexión WebRTC si está abierta
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
      setConectado(false)
      toast({
        variant: 'destructive',
        title: 'Error de conexión',
        description: 'No se pudo conectar al servidor.',
      })
    }

    ws.onmessage = async (event) => {
      console.log('[WS] Mensaje recibido:', event.data)
      try {
        const [tipo, origenId, payload] = event.data.split('::')
        if (!tipo || !origenId || !payload) return

        if (tipo === 'OFFER') {
          console.log('[WebRTC] Recibida OFFER de', origenId)
          const pc = new RTCPeerConnection(iceServers)
          pcRef.current = pc

          localStreamRef.current?.getTracks().forEach((track) =>
            pc.addTrack(track, localStreamRef.current!)
          )

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              enviarMensaje(`ICE::${origenId}::${JSON.stringify(event.candidate)}`)
            }
          }

          pc.ontrack = (event) => {
            if (videoRef.current) videoRef.current.srcObject = event.streams[0]
          }

          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(payload)))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          enviarMensaje(`ANSWER::${origenId}::${JSON.stringify(answer)}`)
        }

        if (tipo === 'ICE' && pcRef.current) {
          const candidate = new RTCIceCandidate(JSON.parse(payload))
          await pcRef.current.addIceCandidate(candidate)
        }
      } catch (error) {
        console.error('[WS] Error:', error)
        console.error('❌ Error procesando mensaje:', error)
      }
    }
  }

  const desconectar = () => {
    wsRef.current?.close()
    pcRef.current?.close()
    localStreamRef.current?.getTracks().forEach((track) => track.stop())

    wsRef.current = null
    pcRef.current = null
    localStreamRef.current = null
    setConectado(false)

    toast({ title: '🔌 Desconectado', description: 'Saliste de la sala.' })
  }

  const toggleCamara = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !camaraActiva
    })
    setCamaraActiva(!camaraActiva)
  }

  const toggleMicrofono = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !microfonoActivo
    })
    setMicrofonoActivo(!microfonoActivo)
  }

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      desconectar()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6a11cb] to-[#2575fc] p-6 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl space-y-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <User size={28} /> Modo Participante
          </h1>
          <div className="flex items-center gap-2">
            <Wifi size={20} className={`transition ${conectado ? 'text-green-500' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${conectado ? 'text-green-600' : 'text-gray-500'}`}>
              {conectado ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <input
            type="text"
            placeholder="🎯 ID de la sala"
            value={salaId}
            onChange={(e) => setSalaId(e.target.value)}
            className="flex-1 px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="👤 Tu nombre o ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex-1 px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={conectar}
            disabled={!salaId || !userId || conectando || conectado}
            className={`gap-2 transition-all duration-300 ${conectado ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {conectado ? <PlugConnected size={18} /> : <PlugZap size={18} className="animate-pulse" />}
            {conectado ? '🔌 Conectado' : conectando ? 'Conectando...' : '✅ Conectar'}
          </Button>

          <Button variant="secondary" onClick={toggleCamara} disabled={!conectado} className="gap-2 transition hover:scale-105">
            {camaraActiva ? <VideoOff size={18} /> : <Video size={18} />}
            {camaraActiva ? 'Apagar Cámara' : 'Prender Cámara'}
          </Button>

          <Button variant="secondary" onClick={toggleMicrofono} disabled={!conectado} className="gap-2 transition hover:scale-105">
            {microfonoActivo ? <MicOff size={18} /> : <Mic size={18} />}
            {microfonoActivo ? 'Apagar Micrófono' : 'Prender Micrófono'}
          </Button>

          <Button variant="destructive" onClick={desconectar} disabled={!conectado} className="gap-2 transition hover:scale-105">
            <XCircle size={18} /> Desconectar
          </Button>
        </div>

        <div className="mt-4">
          <h3 className="text-center text-slate-600 mb-2">🎥 Vista del instructor</h3>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg border border-slate-200 shadow-md"
          />
        </div>
      </div>
    </div>
  )
}

export default Client
