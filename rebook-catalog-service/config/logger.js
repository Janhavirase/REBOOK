const pino = require('pino');
const pinoHttp = require('pino-http');
const { v4: uuidv4 } = require('uuid');

// 1. Core Logger Configuration
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Use pretty print in development, pure JSON in production
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' }
  } : undefined,
});

// 2. Express Request Logger Middleware
const requestLogger = pinoHttp({
  logger,
  // Custom function to generate or extract the Correlation ID
  genReqId: function (req, res) {
    // If a service receives the header, use it. Otherwise, generate a new one.
    const existingId = req.id || req.headers['x-correlation-id'];
    if (existingId) return existingId;
    
    const newId = uuidv4();
    res.setHeader('x-correlation-id', newId);
    return newId;
  },
  // Customize the log output format
  customProps: (req, res) => {
    return {
      correlationId: req.id
    };
  }
});

module.exports = { logger, requestLogger };