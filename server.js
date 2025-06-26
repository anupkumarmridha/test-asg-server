const express = require('express');
const path = require('path');
const fs = require('fs');
const { config, isProduction, isDevelopment } = require('./config');
const {
  testDatabaseConnection,
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getSystemHealth,
  closeConnection
} = require('./services/database');

const app = express();
const port = config.app.port;

// Ensure logs directory exists
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir) && logDir !== '.') {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(__dirname, config.logging.file);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${level.toUpperCase()}] - ${message}\n`;
  
  // Write to file
  logStream.write(logMessage);
  
  // Console logging based on configuration
  if (config.logging.enableConsole) {
    console.log(logMessage.trim());
  }
};

// Log startup information
log(`Starting ${config.app.name} v${config.app.version}`);
log(`Environment: ${config.app.env}`);
log(`Port: ${port}`);
log(`Logging to: ${config.logging.file}`);
log(`Console logging: ${config.logging.enableConsole ? 'enabled' : 'disabled'}`);
log(`CORS: ${config.api.enableCors ? 'enabled' : 'disabled'}`);
log(`Metrics: ${config.monitoring.enableMetrics ? 'enabled' : 'disabled'}`);

// Security headers for production
if (isProduction()) {
  app.use((req, res, next) => {
    res.setHeader('X-Powered-By', config.app.name);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

app.use(express.json());
app.use((req, res, next) => {
  log(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Dummy data store
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: new Date().toISOString() },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date().toISOString() },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', createdAt: new Date().toISOString() }
];

let nextId = 4;

app.get('/', (req, res) => {
  const welcomeData = {
    message: 'Welcome to test-asg-server',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      'GET / - This welcome message',
      'GET /health - Health check endpoint',
      'GET /api/users - Get all users',
      'GET /api/users/:id - Get user by ID',
      'POST /api/users - Create new user',
      'PUT /api/users/:id - Update user by ID',
      'DELETE /api/users/:id - Delete user by ID'
    ]
  };
  log('Root endpoint accessed');
  res.status(200).json(welcomeData);
});

app.get(config.healthCheck.endpoint, async (req, res) => {
  log('Health check requested');
  
  try {
    // Test database connection
    const dbHealth = await testDatabaseConnection();
    
    const healthData = {
      status: dbHealth.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: config.app.version,
      environment: config.app.env,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbHealth,
      features: {
        cors: config.api.enableCors,
        metrics: config.monitoring.enableMetrics
      }
    };
    
    const statusCode = dbHealth.connected ? 200 : 503;
    res.status(statusCode).json(healthData);
  } catch (error) {
    log(`Health check failed: ${error.message}`, 'error');
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

// API Routes
// GET all users
app.get('/api/users', (req, res) => {
  log(`Retrieved ${users.length} users`);
  res.status(200).json({
    success: true,
    data: users,
    count: users.length,
    timestamp: new Date().toISOString()
  });
});

// GET user by ID
app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    log(`User not found: ID ${userId}`);
    return res.status(404).json({
      success: false,
      error: 'User not found',
      timestamp: new Date().toISOString()
    });
  }
  
  log(`Retrieved user: ID ${userId}`);
  res.status(200).json({
    success: true,
    data: user,
    timestamp: new Date().toISOString()
  });
});

// POST create new user
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    log('Failed to create user: Missing required fields');
    return res.status(400).json({
      success: false,
      error: 'Name and email are required',
      timestamp: new Date().toISOString()
    });
  }
  
  const newUser = {
    id: nextId++,
    name,
    email,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  log(`Created new user: ID ${newUser.id}, Name: ${name}`);
  
  res.status(201).json({
    success: true,
    data: newUser,
    message: 'User created successfully',
    timestamp: new Date().toISOString()
  });
});

// PUT update user by ID
app.put('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email } = req.body;
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    log(`Failed to update user: ID ${userId} not found`);
    return res.status(404).json({
      success: false,
      error: 'User not found',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!name || !email) {
    log(`Failed to update user: Missing required fields for ID ${userId}`);
    return res.status(400).json({
      success: false,
      error: 'Name and email are required',
      timestamp: new Date().toISOString()
    });
  }
  
  users[userIndex] = {
    ...users[userIndex],
    name,
    email,
    updatedAt: new Date().toISOString()
  };
  
  log(`Updated user: ID ${userId}`);
  res.status(200).json({
    success: true,
    data: users[userIndex],
    message: 'User updated successfully',
    timestamp: new Date().toISOString()
  });
});

// DELETE user by ID
app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    log(`Failed to delete user: ID ${userId} not found`);
    return res.status(404).json({
      success: false,
      error: 'User not found',
      timestamp: new Date().toISOString()
    });
  }
  
  const deletedUser = users[userIndex];
  users.splice(userIndex, 1);
  
  log(`Deleted user: ID ${userId}, Name: ${deletedUser.name}`);
  res.status(200).json({
    success: true,
    data: deletedUser,
    message: 'User deleted successfully',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  const notFoundData = {
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET / - Welcome message',
      'GET /health - Health check'
    ]
  };
  log(`404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json(notFoundData);
});

app.listen(port, () => {
  log(`Server started on port ${port}`);
});