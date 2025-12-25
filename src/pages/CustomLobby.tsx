import { useEffect, useState } from 'react';

interface LobbyProps {
  onJoin: (displayName: string, selectedCamera: string, selectedMic: string) => void;
}

export default function CustomLobby({ onJoin }: LobbyProps) {
  const [displayName, setDisplayName] = useState('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMic, setSelectedMic] = useState('');

  const [videoStream, setVideoStream] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      setCameras(videoInputs);
      setMics(audioInputs);
      setSelectedCamera(videoInputs[0]?.deviceId || '');
      setSelectedMic(audioInputs[0]?.deviceId || '');
    });
  }, []);

  useEffect(() => {
    if (selectedCamera && videoStream) {
      navigator.mediaDevices
        .getUserMedia({ video: { deviceId: selectedCamera } })
        .then(stream => {
          videoStream.srcObject = stream;
        });
    }
  }, [selectedCamera, videoStream]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 text-white px-4">
      <h1 className="text-3xl font-bold mb-6">Sala de videollamada</h1>

      <div className="bg-white text-black rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
        <input
          type="text"
          placeholder="Tu nombre"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
        />

        <label className="block text-sm font-medium mt-2">Cámara:</label>
        <select
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          value={selectedCamera}
          onChange={e => setSelectedCamera(e.target.value)}
        >
          {cameras.map(cam => (
            <option key={cam.deviceId} value={cam.deviceId}>
              {cam.label || 'Cámara'}
            </option>
          ))}
        </select>

        <label className="block text-sm font-medium mt-2">Micrófono:</label>
        <select
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          value={selectedMic}
          onChange={e => setSelectedMic(e.target.value)}
        >
          {mics.map(mic => (
            <option key={mic.deviceId} value={mic.deviceId}>
              {mic.label || 'Micrófono'}
            </option>
          ))}
        </select>

        <div className="mt-4">
          <label className="block text-sm font-medium">Vista previa:</label>
          <video
            ref={el => setVideoStream(el)}
            autoPlay
            muted
            className="rounded-lg w-full mt-2 border"
            style={{ aspectRatio: '16/9', backgroundColor: '#000' }}
          />
        </div>

        <button
          disabled={!displayName}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full"
          onClick={() => onJoin(displayName, selectedCamera, selectedMic)}
        >
          Entrar a la sala
        </button>
      </div>
    </div>
  );
}
