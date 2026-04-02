const express = require('express');
const mongoose = require('mongoose');
const { BOT_TOKEN, MONGO_URI, WEBHOOK_DOMAIN, PORT } = require('./config/env');
const { connectToDatabase } = require('./db/mongoose');
const { createBot, registerTelegramCommands } = require('./bot');

async function bootstrap() {
  try {
    await connectToDatabase(MONGO_URI);

    const bot = createBot(BOT_TOKEN);
    await registerTelegramCommands(bot);
    await bot.launch();

    console.log('Bot is running');

    const app = express();
    app.get('/', (req, res) => res.send('OK'));
    app.get('/health', (req, res) => res.json({ status: 'ok' }));

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`HTTP server listening on port ${PORT}`);
    });

    const stop = async (signal) => {
      console.log(`Received ${signal}. Stopping bot and closing DB connection...`);
      bot.stop(signal);
      await mongoose.connection.close();
      process.exit(0);
    };

    process.once('SIGINT', () => {
      stop('SIGINT').catch((error) => {
        console.error('Error on shutdown (SIGINT):', error);
        process.exit(1);
      });
    });

    process.once('SIGTERM', () => {
      stop('SIGTERM').catch((error) => {
        console.error('Error on shutdown (SIGTERM):', error);
        process.exit(1);
      });
    });
  } catch (error) {
    console.error('Failed to start bot:', error.message);
    process.exit(1);
  }
}

bootstrap();
