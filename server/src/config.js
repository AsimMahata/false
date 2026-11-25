import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/statement_tracker',
  dbName: process.env.DB_NAME || 'statement_tracker',
  nodeEnv: process.env.NODE_ENV || 'development',
};
