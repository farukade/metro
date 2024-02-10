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

export const ContactController = {
  create: async (req: Request, res: Response) => {
    try {
      const { name, phone, image, description, phoneTwo, email, emailTwo } =
        req.body;
      const expectedKeys = ["name", "phone", "email"];
      const objProps = Object.keys(req.body);

      for (const key of expectedKeys) {
        if (!objProps.includes(key)) {
          return handleBadRequest({ res, message: `${key} is required!` });
        }
      }

      const newContact = await prisma.contacts.create({
        data: {
          name,
          phone,
          image,
          description,
          phoneTwo,
          email,
          emailTwo,
        },
      });

      return handleSuccess({
        res,
        data: newContact,
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const { name, phone, image, description, phoneTwo, email, emailTwo } =
        req.body;
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
      const { id } = req.query;
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
      } else {
        result = await prisma.contacts.findMany({
          where: { status: true },
          skip,
          take,
        });
        aggregation = await prisma.contacts.aggregate({
          where: { status: true },
          _count: { id: true },
        });
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
