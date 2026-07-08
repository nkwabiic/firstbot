import { container } from './src/app/container.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.create({ data: { phone: '123456789' } });
  const conversation = await prisma.conversation.create({ data: { userId: user.id } });
  await container.fsm.processMessage(user, conversation, "Hello");
  console.log("Done processMessage 1");
  await container.fsm.processMessage(user, conversation, "1");
  console.log("Done processMessage 2");
}
run().catch(console.error).finally(() => process.exit(0));
