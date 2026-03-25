import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Resend } from 'resend';
import Mux from '@mux/mux-node';
import { initializeApp as initAdmin, applicationDefault } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config for Admin SDK
const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
const firebaseConfig = fs.existsSync(firebaseConfigPath) 
  ? JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'))
  : {};

const projectId = firebaseConfig.projectId || 'ccn-daily';
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

let adminDb: any = null;
try {
  const adminApp = initAdmin({
    credential: applicationDefault(),
    projectId: projectId
  });
  adminDb = getAdminFirestore(adminApp, databaseId);
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
}

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

  // --- Resend Email Endpoint ---
  app.post('/api/send-email', async (req, res) => {
    try {
      const { to, subject, html } = req.body;
      
      if (!process.env.RESEND_API_KEY) {
        return res.status(500).json({ error: 'RESEND_API_KEY is not configured.' });
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Professional HTML Wrapper
      const formattedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #141414; border-radius: 12px; overflow: hidden; border: 1px solid #333; max-width: 600px;">
                  <tr>
                    <td style="background-color: #F27D26; padding: 30px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">PROJECT PHOENIX</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #ffffff; margin-top: 0; margin-bottom: 20px; font-size: 22px;">${subject}</h2>
                      <div style="color: #cccccc; line-height: 1.6; font-size: 16px;">
                        ${html.replace(/\n/g, '<br>')}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #050505; padding: 20px; text-align: center; border-top: 1px solid #222;">
                      <p style="color: #666666; font-size: 12px; margin: 0;">Sent securely via The CCN Daily Broadcast Engine</p>
                      <p style="color: #444444; font-size: 10px; margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} Project Phoenix. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const data = await resend.emails.send({
        from: process.env.EMAIL_FROM_ADDRESS || 'The CCN Daily <hello@updates.theccndaily.com>', // Uses env var or defaults to the subdomain they set up
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: formattedHtml,
      });

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: error.message || 'Failed to send email' });
    }
  });

  // --- Resend Webhook (Receiving Emails) ---
  app.post('/api/webhooks/resend', async (req, res) => {
    try {
      const payload = req.body;
      
      // Resend sends the parsed email payload to this webhook
      if (adminDb && payload) {
        await adminDb.collection('inbox').add({
          from: payload.from || 'Unknown Sender',
          to: payload.to || 'Unknown Recipient',
          subject: payload.subject || 'No Subject',
          text: payload.text || '',
          html: payload.html || '',
          receivedAt: new Date(),
          status: 'unread'
        });
        console.log('Saved incoming email to Firestore inbox');
      } else {
        console.warn('Received webhook but adminDb is not initialized');
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).send('Error processing webhook');
    }
  });

  // --- Mux Video Endpoints ---
  app.post('/api/mux/live', async (req, res) => {
    try {
      if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
        return res.status(500).json({ error: 'Mux API keys are not configured.' });
      }

      const mux = new Mux({
        tokenId: process.env.MUX_TOKEN_ID,
        tokenSecret: process.env.MUX_TOKEN_SECRET,
      });

      // Create a new live stream
      const stream = await mux.video.liveStreams.create({
        playback_policy: ['public'],
        new_asset_settings: { playback_policy: ['public'] },
      });

      res.status(200).json({
        streamKey: stream.stream_key,
        playbackId: stream.playback_ids?.[0]?.id,
        streamId: stream.id,
      });
    } catch (error: any) {
      console.error('Error creating Mux live stream:', error);
      res.status(500).json({ error: error.message || 'Failed to create live stream' });
    }
  });

  app.post('/api/mux/upload', async (req, res) => {
    try {
      if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
        return res.status(500).json({ error: 'Mux API keys are not configured.' });
      }

      const mux = new Mux({
        tokenId: process.env.MUX_TOKEN_ID,
        tokenSecret: process.env.MUX_TOKEN_SECRET,
      });

      // Create a direct upload URL for VOD
      const upload = await mux.video.uploads.create({
        new_asset_settings: { playback_policy: ['public'] },
        cors_origin: '*', // In production, restrict this to your app's domain
      });

      res.status(200).json({
        uploadUrl: upload.url,
        uploadId: upload.id,
      });
    } catch (error: any) {
      console.error('Error creating Mux upload:', error);
      res.status(500).json({ error: error.message || 'Failed to create upload URL' });
    }
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
