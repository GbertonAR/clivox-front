import { useEffect, useRef, useState } from "react";

const Client = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [salaId, setSalaId] = useState("");
  const [userId, setUserId] = useState(""); // único id cliente
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const conectar = async () => {
    if (!salaId || !userId) {
      alert("Ingresá sala y usuario");
      return;
    }

    const ws = new WebSocket(`ws://localhost:8000/ws/cliente/${salaId}/${userId}`);
    wsRef.current = ws;

    // Pedir cámara y micrófono
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      alert("Error accediendo a cámara y micrófono: " + e);
      return;
    }

    ws.onmessage = async (event) => {
      const [tipo, origenId, payload] = event.data.split("::", 3);

      if (tipo === "OFFER") {
        // Cliente recibe oferta (del instructor), crea respuesta
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        pcRef.current = pc;

        // Agregar tracks locales (video/audio)
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));
        }

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            ws.send(`ICE::${origenId}::${JSON.stringify(event.candidate)}`);
          }
        };

        pc.ontrack = (event) => {
          // Cliente puede mostrar video remoto (Instructor)
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(payload)));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(`ANSWER::${origenId}::${JSON.stringify(answer)}`);
      } else if (tipo === "ICE" && pcRef.current) {
        const candidate = new RTCIceCandidate(JSON.parse(payload));
        await pcRef.current.addIceCandidate(candidate);
      }
    };

    ws.onopen = () => {
      console.log("Conectado WS Cliente");
    };

    ws.onerror = (err) => {
      console.error("WS Error", err);
    };
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Cliente</h1>
      <input placeholder="Sala ID" value={salaId} onChange={(e) => setSalaId(e.target.value)} />
      <input placeholder="Tu ID único" value={userId} onChange={(e) => setUserId(e.target.value)} />
      <button onClick={conectar}>Conectar</button>
      <div>
        <h3>Tu cámara</h3>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: 320, border: "1px solid black" }} />
      </div>
    </div>
  );
};

export default Client;
