import { prisma } from "../utils/utils";
import { exportedContacts } from "./data/contacts";

async function main() {
  for (const contact of exportedContacts) {
    const con = await prisma.contacts.create({
      data: contact,
    });

    await prisma.contactGroups.create({
      data: { groupId: 1, contactId: con.id },
    });

    console.log(`CONTACT - ${con.id}: GROUP - ${1}`);
  }
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
