import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), '.next', 'dev', 'types');

if (existsSync(target)) {
  try {
    rmSync(target, { recursive: true, force: true });
    console.log(`[prebuild] Removed stale Next dev types: ${target}`);
  } catch (error) {
    if (error?.code === 'EPERM' || error?.code === 'EBUSY') {
      console.warn(`[prebuild] Could not remove locked Next dev types, continuing: ${target}`);
    } else {
      throw error;
    }
  }
}
