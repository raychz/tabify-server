const config = require('dotenv-safe').config;	
config();

const SOURCE_PATH =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
    ? 'dist'
    : 'src';
const isDevelopment = process.env.NODE_ENV === 'development';
module.exports = {
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_TCP_PORT,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  synchronize: isDevelopment || process.env.FORCE_SYNCHRONIZATION,
  logging: isDevelopment,
  entities: [
    isDevelopment ? `src/**/*.entity.ts` : `dist/**/*.entity.js`,
  ],
  migrations: [`src/migration/**/*.ts`],
  subscribers: ['src/subscriber/**/*.ts'],
  cli: {
    entitiesDir: 'src/entity',
    migrationsDir: 'src/migration',
    subscribersDir: 'src/subscriber',
  },
};
