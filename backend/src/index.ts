import app from './app';
import { env } from './config/env';
import schedulerService from './services/scheduler.service';

const start = async () => {
  try {
    // Start the Express server
    app.listen(env.PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ⚗️  AMSPEC Lab Inventory Management System              ║
║                                                          ║
║   🚀 Server running on http://localhost:${env.PORT}            ║
║   📊 Environment: ${env.NODE_ENV.padEnd(38)}║
║   🗄️  Database: Connected via Prisma                      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });

    // Initialize the email scheduler
    schedulerService.init();

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
