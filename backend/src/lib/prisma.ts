import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const dbUrl = process.env.DATABASE_URL || ''
  const urlWithLimit = dbUrl.includes('?') 
    ? `${dbUrl}&connection_limit=10` 
    : `${dbUrl}?connection_limit=10`
    
  return new PrismaClient({
    datasources: {
      db: {
        url: urlWithLimit
      }
    }
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
