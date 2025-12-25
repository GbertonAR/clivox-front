import React, { useEffect, useState } from 'react'
import VideoCall from './VideoCall'

const Videollamada: React.FC = () => {
  const [callInfo, setCallInfo] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('http://localhost:8000/api/videocall-info')
      const data = await res.json()
      setCallInfo(data)
    }

    fetchData()
  }, [])

  if (!callInfo) return <div>Cargando información de videollamada...</div>

  return (
    <VideoCall
      userId={callInfo.user_id}
      displayName={callInfo.display_name}
      token={callInfo.token}
      threadId={callInfo.thread_id}
    />
  )
}

export default Videollamada
