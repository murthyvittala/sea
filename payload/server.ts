import express from 'express';
import payload from 'payload';

require('dotenv').config();

const app = express();

const start = async () => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'dev-secret',
    mongoURL: process.env.MONGODB_URI || 'mongodb://localhost/payload',
    express: app,
  });

  app.listen(3001, () => {
    console.log('Payload admin running on http://localhost:3001/admin');
  });
};

start();
