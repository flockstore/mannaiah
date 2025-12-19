import { MongoMemoryServer } from 'mongodb-memory-server'

export default async function () {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const instance: MongoMemoryServer = (global as any).__MONGOINSTANCE
  if (instance) {
    await instance.stop()
  }
}
