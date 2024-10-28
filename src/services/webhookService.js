// src/services/webhookService.js
import express from 'express';
import cors from 'cors';

export class WebhookService {
  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.subscribers = new Set();

    // Middleware
    this.app.use(cors());
    this.app.use(express.json());

    // Webhook endpoint
    this.app.post('/webhook', (req, res) => {
      const streamData = req.body;
      this.notifySubscribers(streamData);
      res.status(200).send('OK');
    });

    // Start server
    this.app.listen(port, () => {
      console.log(`Webhook server listening on port ${port}`);
    });
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(data) {
    this.subscribers.forEach(callback => callback(data));
  }
}