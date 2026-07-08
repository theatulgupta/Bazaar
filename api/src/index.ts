import app from './app.js';
import connectDB from './config/database.js';
import { env } from './config/env.js';

connectDB().then(() => {
  app.listen(Number(env.PORT), env.IP_ADDRESS, () => {
    console.log(`Server running at http://${env.IP_ADDRESS}:${env.PORT}`);
  });
});
