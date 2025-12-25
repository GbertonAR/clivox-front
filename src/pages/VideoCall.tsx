import React, { useEffect, useState } from 'react'
import {
  CallComposite,
  createAzureCommunicationCallAdapter,
} from '@azure/communication-react'
import { AzureCommunicationTokenCredential } from '@azure/communication-common'

type VideoCallProps = {
  userId: string
  displayName: string
  token: string
  threadId: string
}

const VideoCall: React.FC<VideoCallProps> = ({ userId, displayName, token, threadId }) => {
  const [adapter, setAdapter] = useState<any>(null)

  useEffect(() => {
    const setupAdapter = async () => {
      try {
        const credential = new AzureCommunicationTokenCredential(token) // ✅ Fix
        const newAdapter = await createAzureCommunicationCallAdapter({
          userId: { communicationUserId: userId },
          displayName,
          credential,
          locator: { groupId: threadId },
        })
        setAdapter(newAdapter)
      } catch (error) {
        console.error('Error creando adapter de videollamada:', error)
      }
    }

    setupAdapter()
    return () => {
      adapter?.dispose()
    }
  }, [userId, displayName, token, threadId])

  if (!adapter) return <div>Conectando a la videollamada...</div>

  return <CallComposite adapter={adapter} />
}

export default VideoCall
