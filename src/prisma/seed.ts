import { prisma } from "../utils/utils";
import { exportedContacts } from "./data/contacts";

async function main() {
  await prisma.contacts.createMany({
    data: exportedContacts,
    skipDuplicates: true,
  });
}

main()
  .then(() => {
    prisma.$disconnect();
  })
  .catch(async (e) => {
    console.log(e);
    await prisma.$disconnect();
    process.exit(1);
  });
