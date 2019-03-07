import { createConnection, Connection, getConnectionOptions } from 'typeorm';
import * as Entities from '../entity';

const entities = Object.values(Entities);

export async function connect() {
  const baseConfig = await getConnectionOptions();
  const isDevelopment = process.env.NODE_ENV === 'development';

  const config = Object.assign(baseConfig, {
    username: process.env.MYSQL_USER || '',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || '',
    host: process.env.MYSQL_HOST,
    synchronize: isDevelopment,
    logging: isDevelopment,
    entities,
  });

  try {
    return await createConnection(config);
  } catch (error) {
    console.log(error); // tslint:disable-line
  }
}
