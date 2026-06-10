import { createLogger } from '@cinacoin/logger';

export const logger = createLogger({ 
  name: 'backend-dashboard', 
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' 
});
