import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config for Admin SDK
const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
const firebaseConfig = fs.existsSync(firebaseConfigPath) 
  ? JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'))
  : {};

const projectId = firebaseConfig.projectId || 'ccn-daily';
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Diagnostic Endpoint (Passive - No AI calls)
  app.get('/api/ai/diagnostics', async (req, res) => {
    const platformKey = process.env.GEMINI_API_KEY;
    const userKey = process.env.API_KEY;
    
    const status: any = {
      databaseId: databaseId,
      projectId: projectId,
      apiKeySource: (platformKey && platformKey !== 'undefined' && platformKey !== '') ? 'GEMINI_API_KEY' : (userKey ? 'API_KEY' : 'none'),
      hasGeminiApiKey: !!(platformKey && platformKey !== 'undefined' && platformKey !== ''),
      hasUserApiKey: !!userKey,
      timestamp: new Date().toISOString(),
    };

    res.json(status);
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
