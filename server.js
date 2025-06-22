const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 8080;

const logFile = path.join(__dirname, 'app.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  logStream.write(logMessage);
  console.log(logMessage.trim());
};

app.use(express.json());
app.use((req, res, next) => {
  log(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

app.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
  log('Health check requested');
  res.status(200).json(healthData);
});

app.listen(port, () => {
  log(`Server started on port ${port}`);
});