import { GroupController } from "../controller/contact-group.controller";
import { prisma } from "../utils/utils";
import { exportedContacts } from "./data/contacts";

async function main() {
  let newGroups: any = [];

  const newGroup = await GroupController.getOrCreateGroup({
    name: "All Contacts",
  });

  newGroups.push(newGroup);

  for (const contact of exportedContacts) {
    const con = await prisma.contacts.create({
      data: contact,
    });

    await prisma.contactGroups.createMany({
      data: newGroups.map((g: any) => {
        return { groupId: g.id, contactId: con.id };
      }),
    });

    console.log(`CONTACT - ${con.id}: GROUP - ${newGroups[0].id}`);
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
