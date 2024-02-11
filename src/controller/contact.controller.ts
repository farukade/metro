import { Request, Response } from "express";
import {
  generateSheet,
  getEnv,
  getMeta,
  getPagination,
  handleBadRequest,
  handleError,
  handleSuccess,
  prisma,
  sheetToJson,
} from "../utils/utils";
import { logger } from "../utils/logger";
import moment from "moment";
import { join } from "path";
import { GroupController } from "./contact-group.controller";

export const ContactController = {
  create: async (req: Request, res: Response) => {
    try {
      const {
        name,
        phone,
        image,
        description,
        phoneTwo,
        email,
        emailTwo,
        groups,
      } = req.body;
      const expectedKeys = ["name", "phone", "email"];
      const objProps = Object.keys(req.body);

      for (const key of expectedKeys) {
        if (!objProps.includes(key)) {
          return handleBadRequest({ res, message: `${key} is required!` });
        }
      }

      let newGroups: any = [];
      if (groups && groups.length) {
        const foundGroups = await prisma.groups.findMany({
          where: { id: { in: groups }, status: true },
        });
        newGroups = [...newGroups, ...foundGroups];
      } else {
        const newGroup = await GroupController.getOrCreateGroup({
          name: "All Contacts",
        });
        newGroups.push(newGroup);
      }

      if (!(await newGroups?.length)) {
        return handleBadRequest({ res, message: "Group creation failed!" });
      }

      const newContact = await prisma.contacts.create({
        data: {
          name,
          phone,
          email,
          image: image ? image : undefined,
          description: description ? description : undefined,
          phoneTwo: phoneTwo ? phoneTwo : undefined,
          emailTwo: emailTwo ? emailTwo : undefined,
        },
      });

      await prisma.contactGroups.createMany({
        data: newGroups.map((g: any) => {
          return { groupId: g.id, contactId: newContact.id };
        }),
      });

      return handleSuccess({
        res,
        data: { ...newContact, groups: [...newGroups] },
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const {
        name,
        phone,
        image,
        description,
        phoneTwo,
        email,
        emailTwo,
        groups,
      } = req.body;
      const objProps = Object.keys(req.body);

      if (!objProps?.length) {
        return handleBadRequest({ res, message: "Nothing to update!" });
      }

      const existing = await prisma.contacts.findFirst({
        where: { id: Number(req.query.id) },
      });

      if (!existing) {
        return handleBadRequest({ res, message: "Contacts not found!" });
      }

      const updatedData = await prisma.contacts.update({
        where: { id: existing.id },
        data: {
          name: name ? name : undefined,
          phone: phone ? phone : undefined,
          image: image ? image : undefined,
          description: description ? description : undefined,
          phoneTwo: phoneTwo ? phoneTwo : undefined,
          email: email ? email : undefined,
          emailTwo: emailTwo ? emailTwo : undefined,
        },
      });

      if (groups && groups.length) {
        const existingGroups = await prisma.contactGroups.findMany({
          where: { contactId: updatedData.id },
        });

        const existingGroupIds = existingGroups?.map((g: any) => g.id);

        let notChanged: number[] = [];
        let newGroups: number[] = [];
        let deletedGroups: number[] = [];
        for (const item of [...groups, ...existingGroupIds]) {
          if (groups.includes(item) && existingGroupIds.includes(item)) {
            notChanged.push(item);
            continue;
          } else if (groups.includes(item)) {
            newGroups.push(item);
            continue;
          } else if (existingGroupIds.includes(item)) {
            deletedGroups.push(item);
            continue;
          }
        }

        if (deletedGroups.length) {
          await prisma.contactGroups.deleteMany({
            where: { id: { in: deletedGroups } },
          });
        }
        if (newGroups.length) {
          await prisma.contactGroups.createMany({
            data: newGroups.map((g: number) => {
              return { contactId: updatedData.id, groupId: g };
            }),
          });
        }
      }

      return handleSuccess({
        res,
        data: updatedData,
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
  remove: async (req: Request, res: Response) => {
    try {
      const deleted = await prisma.contacts.update({
        data: { status: false },
        where: { id: Number(req.query.id) },
      });
      return handleSuccess({
        res,
        message: "Contact deleted",
        data: deleted,
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
  get: async (req: Request, res: Response) => {
    try {
      const { id, key, groupId } = req.query;
      const { skip, take } = getPagination(req.query);

      let result: any;
      let aggregation: any;
      if (Number(id)) {
        result = await prisma.contacts.findFirst({
          where: { id: Number(id), status: true },
        });
        aggregation = await prisma.contacts.aggregate({
          where: { id: Number(id), status: true },
          _count: { id: true },
        });
        const foundgroups = await prisma.contactGroups.findMany({
          where: { contactId: Number(id) },
        });
        result = { ...result, groups: foundgroups };
      } else {
        const contactGroups = groupId
          ? await prisma.contactGroups.findMany({
              where: {
                groupId: groupId ? Number(groupId) : undefined,
              },
            })
          : [];
        const res = await prisma.contacts.findMany({
          where: {
            id: groupId
              ? { in: contactGroups.map((cg: any) => cg.contactId) }
              : undefined,
            status: true,
            name:
              key && key !== ""
                ? {
                    contains: String(key),
                    mode: "insensitive",
                  }
                : undefined,
          },
          include: {
            contactGroups: {
              include: {
                group: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        });
        aggregation = await prisma.contacts.aggregate({
          where: { status: true },
          _count: { id: true },
        });

        let newResult: any = [];

        for (const item of res) {
          let newGroups: any = [];
          const { contactGroups, ...restItem } = item;
          if (contactGroups && contactGroups.length) {
            for (const cg of contactGroups) {
              const { group } = cg;
              if (group) {
                newGroups = [...newGroups, group];
              }
            }
          }
          newResult = [...newResult, { ...item, groups: newGroups }];
        }

        result = newResult;
      }

      const paging = getMeta(req.query, aggregation?._count?.id);

      return handleSuccess({
        res,
        paging,
        data: result,
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
  upload: async (req: Request, res: Response) => {
    try {
      const file = req.files[0];

      const productData = await sheetToJson(file);

      let passed: any = [];
      let failed: any = [];

      for (const item of productData) {
        let newItem: any = {};

        newItem.name = ContactController.formatStringData(item.name, true);
        newItem.phone = ContactController.formatStringData(item.phone, true);
        newItem.phoneTwo = ContactController.formatStringData(
          item.phoneTwo,
          true
        );
        newItem.email = ContactController.formatStringData(item.email, true);
        newItem.emailTwo = ContactController.formatStringData(
          item.emailTwo,
          true
        );
        newItem.description = ContactController.formatStringData(
          item.description,
          true
        );

        passed.push(newItem);
      }

      let count = 0;
      if (passed.length) {
        for (const item of passed) {
          try {
            const existing = await prisma.contacts.findFirst({
              where: { name: item.name, description: item.description },
            });

            if (!existing) {
              await prisma.contacts.create({
                data: item,
              });
              count++;
            }
          } catch (error) {
            logger.info(error);
            failed.push({
              ...item,
              reason: error.message || "Failed to save product!",
            });
            continue;
          }
        }
      }

      const filename = `failed_contact_upload_${moment().format(
        "YYYYMMDD"
      )}${moment().format("HHmmssSSS")}.xlsx`;
      const filepath = join(__dirname, "../../public/outputs", filename);

      if (failed.length) {
        generateSheet({ filepath, data: failed });
      }
      const data = failed.length ? { url: `outputs/${filename}` } : undefined;
      if (count) {
        return handleSuccess({
          res,
          message: count + " contacts created!",
          data,
        });
      } else {
        return handleBadRequest({
          res,
          data,
          message: count + " contacts created!",
        });
      }
    } catch (error) {
      return handleError(res, error);
    }
  },
  formatBooleanData: (str: string) => {
    let result: boolean = undefined;
    switch (str?.trim()?.toLowerCase()) {
      case "yes":
        result = true;
        break;
      case "true":
        result = true;
        break;

      case "no":
        result = false;
        break;
      case "false":
        result = false;
        break;

      default:
        break;
    }
    return result;
  },
  formatStringData: (str: string, lower = false): String => {
    return lower ? str?.trim().toLowerCase() : str?.trim();
  },
  formatNumberData: (num: string): Number => {
    if (!num) {
      return 0;
    }
    const newNum = String(num)?.replace(/[^0-9.]/g, "");
    return isNaN(Number(newNum)) ? 0 : Number(newNum);
  },
  uploadTemplate: async (req: Request, res: Response) => {
    try {
      const contact = await prisma.contacts.findFirst();
      const contactKeys = Object.keys(contact);

      const filename = "contact_template.xlsx";
      const filepath = join(__dirname, "../../public/outputs", filename);

      let content: any = {};

      const excludedKeys = [
        "image",
        "status",
        "id",
        "createdAt",
        "updatedAt",
        "createdBy",
        "lastChangedBy",
      ];

      for (const key of [...contactKeys]) {
        if (excludedKeys.includes(key)) {
          continue;
        }
        content = {
          ...content,
          [key]: null,
        };
      }

      generateSheet({ filepath, data: [content] });

      return handleSuccess({
        res,
        data: {
          url: `${getEnv("SERVER_DOMAIN")}/outputs/${filename}`,
        },
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
};
