const mongoose = require('mongoose');

async function connectToDatabase(uri) {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  await mongoose.connect(uri);
}

module.exports = {
  connectToDatabase,
};
