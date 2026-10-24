import { startServer } from './server.mjs';

export default async function globalSetup() {
  const server = await startServer(8790);
  return () => server.stop();
}
