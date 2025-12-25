import { useEffect, useRef, useState } from "react";

type RemoteStream = {
  userId: string;
  stream: MediaStream;
  pc: RTCPeerConnection;
};

const Instructor = () => {
  const [salaId, setSalaId] = useState("");
  const [userId, setUserId] = useState("instructor"); // fijo instructor
  const wsRef = useRef<WebSocket | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);

  const conectar = () => {
    if (!salaId) {
      alert("Ingresá sala");
      return;
    }
    const ws = new WebSocket(`ws://localhost:8000/ws/instructor/${salaId}/${userId}`);
    wsRef.current = ws;

    ws.onmessage = async (event) => {
      const [tipo, origenId, payload] = event.data.split("::", 3);

      if (tipo === "ANSWER") {
        // Recibimos respuesta de cliente
        const pc = pcsRef.current.get(origenId);
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(payload)));
      } else if (tipo === "ICE") {
        const pc = pcsRef.current.get(origenId);
        if (!pc) return;
        const candidate = new RTCIceCandidate(JSON.parse(payload));
        await pc.addIceCandidate(candidate);
      } else if (tipo === "OFFER") {
        // No esperado en instructor (cliente hace OFFER)
      }
    };

    ws.onopen = () => {
      console.log("Instructor WS conectado");
    };

    ws.onerror = (err) => {
      console.error("WS Error", err);
    };
  };

  // Crear conexión WebRTC por cada cliente nuevo y enviar OFFER
  const conectarCliente = async (clienteId: string) => {
    if (!wsRef.current) return;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcsRef.current.set(clienteId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current!.send(`ICE::${clienteId}::${JSON.stringify(event.candidate)}`);
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams((streams) => {
        // Evitar duplicados
        if (streams.find((s) => s.userId === clienteId)) return streams;
        return [...streams, { userId: clienteId, stream: event.streams[0], pc }];
      });
    };

    // No agregamos stream local al instructor, solo recibe

    // Crear oferta y enviar a cliente
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    wsRef.current.send(`OFFER::${clienteId}::${JSON.stringify(offer)}`);
  };

  // Escuchar usuarios que se conectan (puedes hacer otro mecanismo de señalización)
  useEffect(() => {
    if (!wsRef.current) return;

    wsRef.current.onmessage = (event) => {
      const [tipo, origenId, payload] = event.data.split("::", 3);
      if (tipo === "NEW_CLIENT") {
        conectarCliente(origenId);
      }
    };
  }, [wsRef.current]);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Instructor</h1>
      <input placeholder="Sala ID" value={salaId} onChange={(e) => setSalaId(e.target.value)} />
      <button onClick={conectar}>Conectar</button>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {remoteStreams.map(({ userId, stream }) => (
          <div key={userId}>
            <h4>{userId}</h4>
            <video
              autoPlay
              playsInline
              ref={(video) => {
                if (video) video.srcObject = stream;
              }}
              style={{ width: 200, border: "1px solid #ccc" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Instructor;
