require('dotenv').config();

/**
 * Application Configuration
 * Centralized configuration management with environment variable support
 */

const config = {
  // Application Settings
  app: {
    name: process.env.APP_NAME || 'test-asg-server',
    version: process.env.APP_VERSION || '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'app.log',
    enableConsole: process.env.ENABLE_CONSOLE_LOGGING === 'true',
  },

  // API Configuration
  api: {
    prefix: process.env.API_PREFIX || '/api',
    enableCors: process.env.ENABLE_CORS === 'true',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Health Check
  healthCheck: {
    endpoint: process.env.HEALTH_CHECK_ENDPOINT || '/health',
  },

  // Database Configuration - Docker or AWS RDS
  database: {
    provider: process.env.DB_PROVIDER || 'docker', // 'docker' or 'aws-rds'
    host: process.env.DB_HOST || (process.env.DB_PROVIDER === 'docker' ? 'localhost' : ''),
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'test_asg_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    type: process.env.DB_TYPE || 'postgresql', // postgresql or mysql
    ssl: process.env.DB_SSL === 'true' || process.env.DB_PROVIDER === 'aws-rds',
    url: process.env.DATABASE_URL || null,
    // Docker specific settings
    docker: {
      containerName: process.env.DB_DOCKER_CONTAINER || 'test-asg-postgres',
      image: process.env.DB_DOCKER_IMAGE || 'postgres:15',
      autoStart: process.env.DB_DOCKER_AUTO_START === 'true'
    },
    // AWS RDS specific settings
    rds: {
      endpoint: process.env.AWS_RDS_ENDPOINT || '',
      region: process.env.AWS_RDS_REGION || 'us-east-1',
      sslMode: process.env.AWS_RDS_SSL_MODE || 'require'
    }
  },

  // Redis Configuration (for future use)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },

  // JWT Configuration (for future use)
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // External Services
  external: {
    apiUrl: process.env.EXTERNAL_API_URL || '',
    apiKey: process.env.EXTERNAL_API_KEY || '',
  },

  // Monitoring & Observability
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT) || 9090,
  },

  // Feature Flags
  features: {
    enableUserManagement: process.env.ENABLE_USER_MANAGEMENT !== 'false',
    enableAdvancedLogging: process.env.ENABLE_ADVANCED_LOGGING === 'true',
  },
};

/**
 * Validate required configuration
 */
const validateConfig = () => {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
    console.warn('Using default values...');
  }

  // Validate port
  if (isNaN(config.app.port) || config.app.port < 1 || config.app.port > 65535) {
    throw new Error(`Invalid port number: ${config.app.port}`);
  }

  // Validate environment
  const validEnvs = ['development', 'staging', 'production', 'test'];
  if (!validEnvs.includes(config.app.env)) {
    console.warn(`Warning: Unknown environment '${config.app.env}'. Using 'development'.`);
    config.app.env = 'development';
  }
};

/**
 * Get configuration for current environment
 */
const getConfig = () => {
  validateConfig();
  return config;
};

/**
 * Check if running in production
 */
const isProduction = () => {
  return config.app.env === 'production';
};

/**
 * Check if running in development
 */
const isDevelopment = () => {
  return config.app.env === 'development';
};

/**
 * Check if running in staging
 */
const isStaging = () => {
  return config.app.env === 'staging';
};

/**
 * Get database connection string (for future use)
 */
const getDatabaseUrl = () => {
  return `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`;
};

module.exports = {
  config: getConfig(),
  isProduction,
  isDevelopment,
  isStaging,
  getDatabaseUrl,
};
