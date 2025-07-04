// src/pages/Client.tsx
import { useEffect, useRef, useState } from 'react'

const Client = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [salaId, setSalaId] = useState('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)

  const conectar = () => {
    if (!salaId) return

    const socket = new WebSocket(`ws://localhost:8000/ws/cliente/${salaId}`)
    setWs(socket)

    socket.onmessage = async (event) => {
      const [type, serverId, payload] = event.data.split('::')

      if (type === 'OFFER') {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
        pcRef.current = pc

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.send(`ICE::${serverId}::${JSON.stringify(event.candidate)}`)
          }
        }

        pc.ontrack = (event) => {
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0]
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(payload)))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.send(`ANSWER::${serverId}::${JSON.stringify(answer)}`)
      } else if (type === 'ICE' && pcRef.current) {
        const candidate = new RTCIceCandidate(JSON.parse(payload))
        await pcRef.current.addIceCandidate(candidate)
      }
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Cliente</h1>
      <input
        type="text"
        placeholder="ID de la sala"
        value={salaId}
        onChange={(e) => setSalaId(e.target.value)}
      />
      <button onClick={conectar}>Conectar a sala</button>
      <video ref={videoRef} autoPlay playsInline style={{ width: '400px', marginTop: '1rem' }} />
    </div>
  )
}

export default Client
