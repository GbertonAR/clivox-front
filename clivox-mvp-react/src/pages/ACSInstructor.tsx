// src/pages/ACSInstructor.tsx
import { useEffect, useState } from 'react'
import {
  AzureCommunicationTokenCredential,
  CommunicationUserIdentifier
} from '@azure/communication-common'
import {
  CallAdapter,
  createAzureCommunicationCallAdapter,
  CallComposite,
  FluentThemeProvider
} from '@azure/communication-react'
import { Spinner } from '@fluentui/react-components'
import type { PartialTheme } from '@fluentui/react'

const ACS_ENDPOINT = import.meta.env.VITE_ACS_ENDPOINT || ''
const GROUP_ID = 'b8b0f4c3-5eaa-4f9b-93a5-000000000000' // mismo que Cliente

const theme: PartialTheme = {
  palette: {
    themePrimary: '#6a11cb',
    white: '#ffffff',
    black: '#000000'
  }
}

const ACSInstructor: React.FC = () => {
  const [adapter, setAdapter] = useState<CallAdapter>()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let disposed = false

    const initAdapter = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/acs/token`, {
          method: 'POST'
        })

        const text = await res.text()

        let data: any
        try {
          data = JSON.parse(text)
          console.log('✅ Token Instructor recibido:', data)
        } catch (err) {
          console.error('❌ Respuesta no es JSON:', text)
          setError('El backend devolvió una respuesta inválida.')
          return
        }

        if (!data.token || !data.user_id) {
          setError('No se pudo obtener token de ACS para instructor.')
          return
        }

        const userId: CommunicationUserIdentifier = {
          communicationUserId: data.user_id
        }
        const credential = new AzureCommunicationTokenCredential(data.token)

        const newAdapter = await createAzureCommunicationCallAdapter({
          userId,
          displayName: 'Instructor',
          credential,
          locator: { groupId: GROUP_ID },
          endpointUrl: ACS_ENDPOINT
        },
        {
          callCompositeOptions: {
              logoUrl: '/img/logo.png',
              backgroundImageUrl: '/img/test1.jpg'
          }
        })
      

        if (!disposed) {
          setAdapter(newAdapter)
        }

      } catch (err) {
        console.error('❌ Error inicializando llamada Instructor:', err)
        setError('No se pudo iniciar la llamada del instructor. Ver consola.')
      }
    }

    initAdapter()

    return () => {
      disposed = true
      adapter?.dispose()
    }
  }, [])

  if (error) {
    return <div style={{ padding: 20, color: 'red' }}>{error}</div>
  }

  if (!adapter) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <Spinner label="Conectando como Instructor..." />
      </div>
    )
  }

  return (
    <FluentThemeProvider fluentTheme={theme}>
      <div
        style={{
          height: '100vh',
          width: '100vw',
          background: 'linear-gradient(135deg, #00c9ff, #6a11cb, #00ff95)',
          backgroundSize: '300% 300%',
          animation: 'gradientShift 15s ease infinite',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        <img
          src="/public/img/logo.png"
          alt="Logo"
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            height: 60,
            zIndex: 10
          }}
        />
        <CallComposite adapter={adapter} />
      </div>
    </FluentThemeProvider>
  )
}

export default ACSInstructor
