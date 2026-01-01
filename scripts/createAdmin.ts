// Usage: ts-node scripts/createAdmin.ts <username> <password>
import { prisma } from '@/server/prisma'
import { hashPassword } from '@/lib/security'

async function main() {
  const [,, username, password] = process.argv
  if (!username || !password) {
    console.error('Usage: node scripts/createAdmin.js <username> <password>')
    process.exit(1)
  }
  const { saltHex, hashHex } = await hashPassword(password)
  const user = await prisma.adminUser.upsert({
    where: { username },
    create: { username, passwordSalt: saltHex, passwordHash: hashHex },
    update: { passwordSalt: saltHex, passwordHash: hashHex, isActive: true },
  })
  console.log('Admin user ready:', user.username)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })

