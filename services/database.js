const { PrismaClient } = require('@prisma/client');
const { config } = require('../config');

/**
 * Database service using Prisma for AWS RDS connectivity
 */

let prisma = null;

/**
 * Initialize Prisma client
 */
const initPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.database.url || process.env.DATABASE_URL
        }
      },
      log: config.app.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    });
  }
  return prisma;
};

/**
 * Test database connection and perform operations
 */
const testDatabaseConnection = async () => {
  try {
    const client = initPrisma();
    const start = Date.now();
    
    // Test basic connection
    await client.$connect();
    
    // Test write operation - insert health check record
    const healthRecord = await client.healthCheck.create({
      data: {
        status: 'healthy',
        metadata: {
          environment: config.app.env,
          timestamp: new Date().toISOString(),
          version: config.app.version
        }
      }
    });

    // Test read operation - get recent health checks
    const recentHealthChecks = await client.healthCheck.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' }
    });

    const responseTime = Date.now() - start;

    // Log system status
    await client.systemStatus.create({
      data: {
        serviceName: 'database',
        status: 'healthy',
        responseTime: responseTime
      }
    });

    return {
      connected: true,
      responseTime,
      database: {
        type: 'postgresql',
        status: 'healthy'
      },
      operations: {
        write: true,
        read: true,
        lastHealthCheckId: healthRecord.id,
        recentChecksCount: recentHealthChecks.length
      },
      metadata: {
        prismaVersion: require('@prisma/client/package.json').version,
        environment: config.app.env
      }
    };
  } catch (error) {
    // Log failed system status
    try {
      if (prisma) {
        await prisma.systemStatus.create({
          data: {
            serviceName: 'database',
            status: 'unhealthy',
            errorMessage: error.message
          }
        });
      }
    } catch (logError) {
      console.error('Failed to log system status:', logError);
    }

    return {
      connected: false,
      error: error.message,
      code: error.code,
      database: {
        type: 'postgresql',
        status: 'unhealthy'
      }
    };
  }
};

/**
 * Get all users from database
 */
const getAllUsers = async () => {
  try {
    const client = initPrisma();
    const users = await client.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: users, count: users.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Create a new user
 */
const createUser = async (userData) => {
  try {
    const client = initPrisma();
    const user = await client.user.create({
      data: userData
    });
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get user by ID
 */
const getUserById = async (id) => {
  try {
    const client = initPrisma();
    const user = await client.user.findUnique({
      where: { id: parseInt(id) }
    });
    return user ? { success: true, data: user } : { success: false, error: 'User not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update user by ID
 */
const updateUser = async (id, userData) => {
  try {
    const client = initPrisma();
    const user = await client.user.update({
      where: { id: parseInt(id) },
      data: userData
    });
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete user by ID
 */
const deleteUser = async (id) => {
  try {
    const client = initPrisma();
    const user = await client.user.delete({
      where: { id: parseInt(id) }
    });
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get system health status
 */
const getSystemHealth = async () => {
  try {
    const client = initPrisma();
    const recentStatus = await client.systemStatus.findMany({
      take: 10,
      orderBy: { checkedAt: 'desc' }
    });
    
    const healthySystems = recentStatus.filter(s => s.status === 'healthy').length;
    const totalSystems = recentStatus.length;
    
    return {
      success: true,
      data: {
        overallHealth: healthySystems === totalSystems ? 'healthy' : 'degraded',
        healthyServices: healthySystems,
        totalServices: totalSystems,
        recentStatus: recentStatus
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Close database connection
 */
const closeConnection = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};

module.exports = {
  initPrisma,
  testDatabaseConnection,
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getSystemHealth,
  closeConnection
};
