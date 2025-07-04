// src/pages/Instructor.tsx
import { useEffect, useRef, useState } from 'react'

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

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Instructor</h1>
      <input
        type="text"
        placeholder="ID de la sala"
        value={salaId}
        onChange={(e) => setSalaId(e.target.value)}
      />
      <button onClick={iniciarConexion}>Iniciar sesión en sala</button>
      <video ref={videoRef} autoPlay muted playsInline style={{ width: '400px', marginTop: '1rem' }} />
    </div>
  )
}

export default Instructor
