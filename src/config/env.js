const dotenv = require('dotenv');

dotenv.config();

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  BOT_TOKEN: getRequiredEnv('BOT_TOKEN'),
  MONGO_URI: getRequiredEnv('MONGO_URI'),
  WEBHOOK_DOMAIN: process.env.WEBHOOK_DOMAIN || null,
  PORT: process.env.PORT || 10000,
};
