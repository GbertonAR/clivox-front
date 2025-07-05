import { useEffect, useRef, useState } from 'react'
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
  
} from 'lucide-react'
import { CheckCircle } from 'lucide-react'

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

  const conectar = async () => {
    if (!salaId || !userId) {
      toast({
        variant: 'destructive',
        title: 'Faltan datos',
        description: 'Ingresá el ID de sala y tu nombre.',
      })
      return
    }

    setConectando(true)
    const ws = new WebSocket(`wss://clivox-backend-cea4bzfcahbpf9fw.westus-01.azurewebsites.net/${salaId}/${userId}`)
    wsRef.current = ws

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Error de acceso',
        description: 'No se pudo acceder a cámara o micrófono.',
      })
      setConectando(false)
      return
    }

    ws.onopen = () => {
      setConectado(true)
      setConectando(false)
      toast({ title: '🔌 Conectado', description: 'Te uniste a la sala exitosamente.' })
    }

    ws.onclose = () => setConectado(false)
    ws.onerror = () => setConectado(false)

    ws.onmessage = async (event) => {
      const [tipo, origenId, payload] = event.data.split('::', 3)

      if (tipo === 'OFFER') {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
        pcRef.current = pc

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!))
        }

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            ws.send(`ICE::${origenId}::${JSON.stringify(event.candidate)}`)
          }
        }

        pc.ontrack = (event) => {
          if (videoRef.current) videoRef.current.srcObject = event.streams[0]
        }

        await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(payload)))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        ws.send(`ANSWER::${origenId}::${JSON.stringify(answer)}`)
      } else if (tipo === 'ICE' && pcRef.current) {
        const candidate = new RTCIceCandidate(JSON.parse(payload))
        await pcRef.current.addIceCandidate(candidate)
      }
    }
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
            className={`gap-2 transition-all duration-300 ${
              conectado ? 'bg-green-600 hover:bg-green-700' : ''
            }`}
          >
            {conectado ? <PlugConnected size={18} /> : <PlugZap size={18} className="animate-pulse" />}
            {conectado ? '🔌 Conectado' : conectando ? 'Conectando...' : '✅ Conectar'}
          </Button>

          <Button
            variant="secondary"
            onClick={toggleCamara}
            disabled={!conectado}
            className="gap-2 transition hover:scale-105"
          >
            {camaraActiva ? <VideoOff size={18} /> : <Video size={18} />}
            {camaraActiva ? 'Apagar Cámara' : 'Prender Cámara'}
          </Button>

          <Button
            variant="secondary"
            onClick={toggleMicrofono}
            disabled={!conectado}
            className="gap-2 transition hover:scale-105"
          >
            {microfonoActivo ? <MicOff size={18} /> : <Mic size={18} />}
            {microfonoActivo ? 'Apagar Micrófono' : 'Prender Micrófono'}
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
