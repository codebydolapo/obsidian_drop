// Address of the Socket.IO server. NEXT_PUBLIC_ values are baked in at build time,
// so redeploy after changing it.
export const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
