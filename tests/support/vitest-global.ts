import type { TestProject } from 'vitest/node';
import { startServer } from './server.mjs';

// Integration tests need the built site and a running Functions runtime. Unit-only runs skip it.
export default async function setup(project: TestProject) {
  const wantsIntegration = !process.argv.some((a) => a.includes('tests/unit'));
  if (!wantsIntegration) return;
  const server = await startServer(8799);
  project.provide('base', server.base);
  return () => server.stop();
}

declare module 'vitest' {
  export interface ProvidedContext {
    base: string;
  }
}
