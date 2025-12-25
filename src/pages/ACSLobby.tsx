import { useEffect, useRef, useState } from 'react'
import {
  AzureCommunicationTokenCredential,
  CommunicationUserIdentifier
} from '@azure/communication-common'
import {
  createAzureCommunicationCallAdapter,
  CallComposite,
  FluentThemeProvider
} from '@azure/communication-react'
import { Dropdown, Button, Input, Label, Spinner } from '@fluentui/react-components'
import './ACSLobby.css' // Te paso también el CSS si querés

const ACS_ENDPOINT = import.meta.env.VITE_ACS_ENDPOINT as string
const GROUP_ID = import.meta.env.VITE_GROUP_ID as string
const ACS_TOKEN = import.meta.env.VITE_ACS_INSTRUCTOR_TOKEN as string
const ACS_USER_ID = import.meta.env.VITE_ACS_INSTRUCTOR_USER_ID as string

export default function ACSLobby() {
  const [adapter, setAdapter] = useState<any | null>(null)
  const [displayName, setDisplayName] = useState('Instructor')
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Detectar cámaras disponibles
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const cams = devices.filter((d) => d.kind === 'videoinput')
      setCameraDevices(cams)
      setSelectedCamera(cams[0]?.deviceId)
    })
  }, [])

  // Mostrar vista previa
  useEffect(() => {
    if (!selectedCamera) return
    navigator.mediaDevices
      .getUserMedia({ video: { deviceId: selectedCamera } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
      .catch(() => setError('No se pudo acceder a la cámara.'))
  }, [selectedCamera])

  // Unirse a la llamada
  const handleJoin = async () => {
    setLoading(true)
    try {
      const userId: CommunicationUserIdentifier = { communicationUserId: ACS_USER_ID }
      const credential = new AzureCommunicationTokenCredential(ACS_TOKEN)

      const newAdapter = await createAzureCommunicationCallAdapter({
        userId,
        displayName,
        credential,
        locator: { groupId: GROUP_ID },
        endpointUrl: ACS_ENDPOINT,
        callCompositeOptions: {
          logoUrl: '/img/logo.png',
          backgroundImageUrl: '/img/test1.jpg',
          callControls: {
            callSurvey: false
          }
        }
      })

      setAdapter(newAdapter)
    } catch (err) {
      console.error('❌ Error iniciando llamada:', err)
      setError('No se pudo iniciar la llamada.')
    } finally {
      setLoading(false)
    }
  }

  if (adapter) {
    return (
      <FluentThemeProvider>
        <div style={{ height: '100vh' }}>
          <CallComposite adapter={adapter} />
        </div>
      </FluentThemeProvider>
    )
  }

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <img src="/img/logo.png" className="lobby-logo" alt="Logo" />
        <h2>Ingreso a videollamada</h2>

        <Label>Nombre a mostrar:</Label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName((e.target as HTMLInputElement).value)}
        />

        <Label>Seleccionar cámara:</Label>
        <Dropdown
          value={cameraDevices.find((c) => c.deviceId === selectedCamera)?.label || 'Cámara'}
          onOptionSelect={(_, data) => setSelectedCamera(data.optionValue as string)}
          options={cameraDevices.map((d) => ({ key: d.deviceId, text: d.label, value: d.deviceId }))}
        />

        <video ref={videoRef} autoPlay playsInline muted className="video-preview" />

        {error && <div className="error-message">{error}</div>}

        <Button appearance="primary" onClick={handleJoin} disabled={loading}>
          {loading ? <Spinner size="tiny" /> : 'Unirme a la llamada'}
        </Button>
      </div>
    </div>
  )
}
