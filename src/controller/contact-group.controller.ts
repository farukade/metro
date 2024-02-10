import { Request, Response } from "express";
import {
  getMeta,
  getPagination,
  handleBadRequest,
  handleError,
  handleSuccess,
  prisma,
} from "../utils/utils";
import { logger } from "../utils/logger";

export const GroupController = {
  create: async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      const expectedKeys = ["name"];
      const objProps = Object.keys(req.body);

      let group: any;
      for (const key of expectedKeys) {
        if (!objProps.includes(key)) {
          return handleBadRequest({ res, message: `${key} is required!` });
        }
      }

      const existing = await prisma.groups.findFirst({
        where: { name },
      });

      if (existing) {
        const result = await prisma.groups.update({
          data: { status: true },
          where: { id: existing.id },
        });
        return handleSuccess({ res, data: result });
      }

      const newGroup = await prisma.groups.create({
        data: {
          name,
        },
      });

      return handleSuccess({
        res,
        data: { ...newGroup, count: 0 },
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      const objProps = Object.keys(req.body);

      if (!objProps?.length) {
        return handleBadRequest({ res, message: "Nothing to update!" });
      }

      const existing = await prisma.groups.findFirst({
        where: { id: Number(req.query.id) },
      });

      if (!existing) {
        return handleBadRequest({ res, message: "Group not found!" });
      }

      const updatedData = await prisma.groups.update({
        where: { id: existing.id },
        data: {
          name: name ? name : undefined,
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
      const deleted = await prisma.groups.update({
        data: { status: false },
        where: { id: Number(req.query.id) },
      });
      return handleSuccess({
        res,
        message: "Group deleted",
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
        const rs = await prisma.groups.findFirst({
          where: { id: Number(id), status: true },
          include: {
            contactGroups: true,
          },
        });
        result = { ...rs, count: rs.contactGroups?.length };
        aggregation = await prisma.groups.aggregate({
          where: { id: Number(id), status: true },
          _count: { id: true },
        });
      } else {
        result = [];
        const rs = await prisma.groups.findMany({
          where: { status: true },
          include: {
            contactGroups: true,
          },
          skip,
          take,
        });

        for (const item of rs) {
          const { contactGroups, ...restItem } = item;
          result = [
            ...result,
            { ...restItem, count: contactGroups?.length || 0 },
          ];
        }
        aggregation = await prisma.groups.aggregate({
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
  getOrCreateGroup: async (data: { name: string }) => {
    try {
      const { name } = data;
      const existing = await prisma.groups.findFirst({
        where: { name },
      });

      if (existing) {
        if (!existing.status) {
          const result = await prisma.groups.update({
            data: { status: true },
            where: { id: existing.id },
          });
          return result;
        } else {
          return existing;
        }
      }

      const result = await prisma.groups.create({
        data: { name },
      });

      return result;
    } catch (error) {
      logger.error(error);
      return null;
    }
  },
};
