// clivox-mvp-react/src/components/VideoRoom.tsx
import React from "react";

interface VideoRoomProps {
  salaId: string;
  usuario: string;
}

const VideoRoom: React.FC<VideoRoomProps> = ({ salaId, usuario }) => {
  const jitsiUrl = `https://meet.jit.si/${salaId}#userInfo.displayName="${encodeURIComponent(usuario)}"`;

  return (
    <iframe
      src={jitsiUrl}
      allow="camera; microphone; fullscreen; display-capture"
      style={{ width: "100%", height: "90vh", border: 0 }}
      allowFullScreen
      title="VideoRoom"
    />
  );
};

export default VideoRoom;
