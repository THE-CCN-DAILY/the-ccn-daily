import fs from 'fs';
import http from 'http';

fs.writeFileSync('startup.log', 'Server started at ' + new Date().toISOString() + '\n');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from http module with logging\n');
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});
