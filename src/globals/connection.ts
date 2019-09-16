import { createConnection, Connection, getConnectionOptions } from 'typeorm';
import * as Entities from '@tabify/entities';

const entities = Object.values(Entities);

export async function connect() {
  const baseConfig = await getConnectionOptions();
  try {
    return await createConnection(baseConfig);
  } catch (error) {
    console.log(error); // tslint:disable-line
  }
}
