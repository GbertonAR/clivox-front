import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

const Instructor = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [salaId, setSalaId] = useState('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const peers = useRef<Record<string, RTCPeerConnection>>({})
  const localStream = useRef<MediaStream | null>(null)

  // ✅ Encender cámara
  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStream.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error('Error al encender cámara:', err)
    }
  }

  // ⛔ Apagar cámara
  const detenerCamara = () => {
    localStream.current?.getTracks().forEach((track) => track.stop())
    localStream.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  // 🔌 Cerrar todo
  const finalizarSesion = () => {
    detenerCamara()

    Object.values(peers.current).forEach((pc) => pc.close())
    peers.current = {}

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
    setWs(null)
  }

  // 🧠 Al montar, encender cámara
  useEffect(() => {
    iniciarCamara()
    return finalizarSesion
  }, [])

  const iniciarConexion = () => {
    if (!salaId) return
    const socket = new WebSocket(`ws://localhost:8000/ws/instructor/${salaId}`)
    setWs(socket)

    socket.onmessage = async (event) => {
      const [type, clientId, payload] = event.data.split('::')

      if (type === 'NEW_CLIENT') {
        await crearConexion(clientId, socket)
      } else if (type === 'ANSWER') {
        const desc = new RTCSessionDescription(JSON.parse(payload))
        await peers.current[clientId]?.setRemoteDescription(desc)
      } else if (type === 'ICE') {
        const candidate = new RTCIceCandidate(JSON.parse(payload))
        await peers.current[clientId]?.addIceCandidate(candidate)
      }
    }
  }

  const crearConexion = async (clientId: string, socket: WebSocket) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    peers.current[clientId] = pc

    localStream.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStream.current!)
    })

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(`ICE::${clientId}::${JSON.stringify(event.candidate)}`)
      }
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket.send(`OFFER::${clientId}::${JSON.stringify(offer)}`)
  }

  return (
    <div className="p-8 max-w-xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold text-center mb-4">🎓 Modo Instructor</h1>

      <input
        type="text"
        placeholder="ID de la sala"
        value={salaId}
        onChange={(e) => setSalaId(e.target.value)}
        className="w-full px-4 py-2 border rounded shadow"
      />

      <div className="flex justify-center flex-wrap gap-4">
        <Button onClick={iniciarCamara}>📷 Encender cámara</Button>
        <Button onClick={detenerCamara} variant="secondary">📴 Apagar cámara</Button>
        <Button onClick={iniciarConexion}>🔴 Iniciar sesión en sala</Button>
        <Button variant="destructive" onClick={finalizarSesion}>⛔ Finalizar sesión</Button>
      </div>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="mt-4 w-full rounded shadow-lg border"
      />
    </div>
  )
}

export default Instructor
