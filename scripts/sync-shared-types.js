import { copyFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const source = './src/shared/sharedTypes.ts';
const dest = './src-tauri/resources/denoBackend/shared/sharedTypes.ts';

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(source, dest);
console.log('✅ Synced sharedTypes.ts');