import CustomLobby from './CustomLobby';

export default function ACSInstructor() {
  const [adapter, setAdapter] = useState<CallAdapter | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const joinCall = async (displayName: string, cameraId: string, micId: string) => {
    try {
      const userId = { communicationUserId: import.meta.env.VITE_USER_ID };
      const tokenCredential = new AzureCommunicationTokenCredential(import.meta.env.VITE_USER_TOKEN);

      const callClient = new CallClient();
      const callAgent = await callClient.createCallAgent(tokenCredential, { displayName });

      const deviceManager = await callClient.getDeviceManager();
      await deviceManager.askDevicePermission({ audio: true, video: true });

      const adapter = await createAzureCommunicationCallAdapter({
        userId,
        displayName,
        credential: tokenCredential,
        locator: { groupId: import.meta.env.VITE_GROUP_CALL_ID },
        callAgent,
        deviceManager
      });

      await deviceManager.selectCamera(cameraId);
      await deviceManager.selectMicrophone(micId);

      setAdapter(adapter);
    } catch (e) {
      setError(e as Error);
    }
  };

  if (error) return <div>Ocurrió un error: {error.message}</div>;

  if (!adapter) return <CustomLobby onJoin={joinCall} />;

  return <CallComposite adapter={adapter} />;
}
