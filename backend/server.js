// Backend de referencia para el test de throughput y las sondas de latencia.
const express = require('express');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 4000;
const MAX_BYTES = 50 * 1024 * 1024;

app.use(cors());
app.disable('x-powered-by');

// Sonda de latencia: respuesta mínima sin caché.
app.get('/ping', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(204).end();
});

// Descarga: payload de tamaño fijo (?bytes=N), por defecto 5 MB.
app.get('/download', (req, res) => {
  const bytes = Math.min(parseInt(req.query.bytes, 10) || 5 * 1024 * 1024, MAX_BYTES);
  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Length': String(bytes),
    'Cache-Control': 'no-store',
  });
  const chunk = Buffer.alloc(64 * 1024, 'a');
  let sent = 0;
  const write = () => {
    while (sent < bytes) {
      const n = Math.min(chunk.length, bytes - sent);
      sent += n;
      if (!res.write(n === chunk.length ? chunk : chunk.subarray(0, n))) {
        return res.once('drain', write);
      }
    }
    res.end();
  };
  write();
});

// Subida: consume el cuerpo y responde (echo) con los bytes recibidos.
app.post('/upload', (req, res) => {
  let received = 0;
  req.on('data', (c) => (received += c.length));
  req.on('end', () => {
    res.set('Cache-Control', 'no-store');
    res.json({ received });
  });
  req.on('error', () => res.status(500).end());
});

app.get('/health', (_req, res) => res.json({ ok: true, time: Date.now() }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`QoS backend escuchando en el puerto ${PORT}`);
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list || []) {
      if (i.family === 'IPv4' && !i.internal) console.log(`  -> http://${i.address}:${PORT}`);
    }
  }
});
