import { createConnection, Connection, getConnectionOptions } from 'typeorm';
import * as Entities from '../entity';

const entities = Object.values(Entities);

export async function connect() {
  const baseConfig = await getConnectionOptions();

  const config = Object.assign(baseConfig, {
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    entities,
  });

  try {
    return await createConnection(config);
  } catch (error) {
    console.log(error); // tslint:disable-line
  }
}
