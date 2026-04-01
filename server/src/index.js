import 'dotenv/config'; // loads .env
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load .env.local if it exists (overrides .env; for local development)
const localEnv = resolve(process.cwd(), '.env.local');
if (existsSync(localEnv)) {
  config({ path: localEnv, override: true });
}

import app from './app.js';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
