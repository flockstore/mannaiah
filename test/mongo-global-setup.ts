import { MongoMemoryServer } from 'mongodb-memory-server'

export default async function () {
  const instance = await MongoMemoryServer.create()
  const uri = instance.getUri()
  ;(global as any).__MONGOINSTANCE = instance
  process.env.MONGO_URI = uri
}
