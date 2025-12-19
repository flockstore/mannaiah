import { MongoMemoryServer } from 'mongodb-memory-server'

export default async function () {
  const instance = await MongoMemoryServer.create()
  const uri = instance.getUri()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  ;(global as any).__MONGOINSTANCE = instance
  process.env.MONGO_URI = uri
}
