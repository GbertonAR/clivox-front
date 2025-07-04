// src/pages/Instructor.tsx
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button' // si usás ShadCN

const Instructor = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [salaId, setSalaId] = useState('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const peers = useRef<Record<string, RTCPeerConnection>>({})
  const localStream = useRef<MediaStream | null>(null)

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream
      localStream.current = stream
    })

    return () => finalizarSesion() // Apagar cámara al desmontar
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

    localStream.current?.getTracks().forEach((track) => pc.addTrack(track, localStream.current!))

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(`ICE::${clientId}::${JSON.stringify(event.candidate)}`)
      }
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket.send(`OFFER::${clientId}::${JSON.stringify(offer)}`)
  }

  const finalizarSesion = () => {
    // 🛑 Apagar cámara y micrófono
    localStream.current?.getTracks().forEach((track) => track.stop())
    localStream.current = null

    // ❌ Cerrar conexiones WebRTC
    Object.values(peers.current).forEach((pc) => pc.close())
    peers.current = {}

    // ❌ Cerrar WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
    setWs(null)

    // 💧 Limpiar video
    if (videoRef.current) videoRef.current.srcObject = null
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

      <div className="flex justify-center gap-4">
        <Button onClick={iniciarConexion}>🔴 Iniciar sesión en sala</Button>
        <Button variant="destructive" onClick={finalizarSesion}>
          ⛔ Finalizar sesión
        </Button>
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
