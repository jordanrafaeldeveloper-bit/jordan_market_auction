const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

let connectionPromise = null;

const connectDB = async () => {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(MONGODB_URI).catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }
  await connectionPromise;
  return mongoose.connection;
};

module.exports = connectDB;
