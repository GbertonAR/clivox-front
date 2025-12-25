// crear_sala_acs.js

import { CommunicationIdentityClient } from "@azure/communication-identity";
import { RoomsClient } from "@azure/communication-rooms";
//import { config } from "dotenv";

// Cargar variables desde .env
//config();

// 🔐 Asegurate de definir esto en un archivo .env (no pongas la clave en el código directamente)
const connectionString = "clivox-back/.envendpoint=https://acs-ansv-chat.unitedstates.communication.azure.com/;accesskey=5GAWgm2ZAPXcr9YpHi65n2ykJukt8kvzRHq5Hu6SXLLXLB7qbfGAJQQJ99BGACULyCpsTPLxAAAAAZCSNrlM";

if (!connectionString) {
  console.error("❌ No se encontró ACS_CONNECTION_STRING en el archivo .env");
  process.exit(1);
}

const identityClient = new CommunicationIdentityClient(connectionString);
const roomsClient = new RoomsClient(connectionString);

// 🔹 Crear usuarios y tokens
async function crearUsuarios(cantidad = 5) {
  const participantes = [];
  for (let i = 0; i < cantidad; i++) {
    const user = await identityClient.createUser();
    const tokenResponse = await identityClient.getToken(user, ["voip"]);
    participantes.push({
      id: i + 1,
      user,
      token: tokenResponse.token,
    });
  }
  return participantes;
}

// 🔹 Crear sala y asignar usuarios con roles
async function crearSala(participantes) {
  const validUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
  const roomResponse = await roomsClient.createRoom({
    validFrom: new Date(),
    validUntil,
    participants: participantes.map((p, idx) => ({
      communicationIdentifier: p.user,
      role: idx === 0 ? "Presenter" : "Attendee", // Usar string directamente
    })),
    
  });

  return roomResponse;
}

// 🔹 Ejecutar
async function main() {
  try {
    console.log("🚀 Creando 5 usuarios...");
    const participantes = await crearUsuarios();

    console.log("🏗️ Creando sala y asignando usuarios...");
    const sala = await crearSala(participantes);

    console.log("✅ Sala creada correctamente:");
    console.log(`🆔 Room ID: ${sala.id}\n`);

    console.log("👥 Participantes:");
    participantes.forEach((p, idx) => {
      console.log(`👤 Participante ${p.id}`);
      console.log(`   🔑 ID: ${p.user.communicationUserId}`);
      console.log(`   🪪 Token: ${p.token.slice(0, 40)}...`);
      console.log(`   🎭 Rol: ${idx === 0 ? "Presenter" : "Attendee"}\n`);
    });

  } catch (err) {
    console.error("❌ Error:", err.message || err);
  }
}

main();
