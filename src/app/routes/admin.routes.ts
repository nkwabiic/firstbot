import { Router, Request, Response, RequestHandler } from 'express';
import { container } from '../container.js';
import qrcode from 'qrcode';

const router = Router();

// Simple authentication middleware
const adminAuthMiddleware: RequestHandler = (req, res, next) => {
  const token = req.query.token;
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    res.status(500).send('ADMIN_TOKEN is not configured in the environment.');
    return;
  }

  if (token !== adminToken) {
    res.status(403).send('Forbidden: Invalid or missing token.');
    return;
  }

  next();
};

router.use(adminAuthMiddleware);

router.get('/whatsapp', async (req: Request, res: Response) => {
  const provider = container.whatsappProvider;
  
  if (provider.isAuthenticated()) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Admin</title>
        <style>body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f0f2f5; }</style>
      </head>
      <body>
        <h1>WhatsApp is already connected.</h1>
      </body>
      </html>
    `);
    return;
  }

  const qrData = provider.getCurrentQR();
  let qrImageSrc = '';

  if (qrData) {
    try {
      qrImageSrc = await qrcode.toDataURL(qrData);
    } catch (err) {
      console.error('Error generating QR image', err);
    }
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WhatsApp QR Authentication</title>
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f0f2f5; }
        .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
        img { max-width: 300px; height: auto; margin-top: 1rem; }
        .spinner { margin-top: 1rem; font-style: italic; color: #666; }
      </style>
      <script>
        const token = new URLSearchParams(window.location.search).get('token');
        function checkStatus() {
          fetch('/admin/whatsapp/status?token=' + token)
            .then(res => res.json())
            .then(data => {
              if (data.authenticated) {
                document.querySelector('.container').innerHTML = '<h2>Authentication completed successfully.</h2>';
              } else if (!data.hasQR && !document.querySelector('img')) {
                // If there's no QR but we're not authenticated yet, we should reload to get it when it's ready.
                setTimeout(() => window.location.reload(), 2000);
              } else if (data.hasQR && !document.querySelector('img')) {
                // QR became available, reload to see it
                window.location.reload();
              }
            })
            .catch(err => console.error('Error checking status', err));
        }
        
        // Poll every 3 seconds
        setInterval(checkStatus, 3000);
      </script>
    </head>
    <body>
      <div class="container">
        <h1>WhatsApp Authentication</h1>
        <p>Scan the QR code below with your WhatsApp app to authenticate.</p>
        ${qrImageSrc ? `<img src="${qrImageSrc}" alt="WhatsApp QR Code" />` : '<div class="spinner">Waiting for QR code generation...</div>'}
      </div>
    </body>
    </html>
  `);
});

router.get('/whatsapp/status', (req: Request, res: Response) => {
  const provider = container.whatsappProvider;
  res.json({
    authenticated: provider.isAuthenticated(),
    hasQR: !!provider.getCurrentQR()
  });
});

export default router;
