import { Request, Response } from "express";
import {
  getMeta,
  getPagination,
  handleBadRequest,
  handleError,
  handleSuccess,
  prisma,
} from "../utils/utils";
import moment from "moment";
import { logger } from "../utils/logger";

export const TransactionController = {
  create: async (req: Request, res: Response) => {
    try {
      const { amount, description, mode, unitValue, date } = req.body;
      const expectedKeys = [
        "amount",
        "description",
        "mode",
        "unitValue",
        "date",
      ];
      const objProps = Object.keys(req.body);

      for (const key of expectedKeys) {
        if (!objProps.includes(key)) {
          return handleBadRequest({ res, message: `${key} is required!` });
        }
      }

      const newTransaction = await prisma.transactions.create({
        data: {
          amount: parseFloat(String(amount)),
          description,
          mode,
          unitValue,
          date,
        },
      });

      // const user = await prisma.users.findFirst({
      //   where: { status: true },
      //   orderBy: { id: "desc" },
      // });

      // if (user) {
      //   await prisma.users.updateMany({
      //     data: { unitBalance: user.unitBalance + unitValue },
      //   });
      // } else {
      //   await prisma.users.updateMany({
      //     data: { unitBalance: unitValue },
      //   });
      // }

      return handleSuccess({
        res,
        data: newTransaction,
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const { amount, description, mode, unitValue, date } = req.body;
      const objProps = Object.keys(req.body);

      if (!objProps?.length) {
        return handleBadRequest({ res, message: "Nothing to update!" });
      }

      const existing = await prisma.transactions.findFirst({
        where: { id: Number(req.query.id) },
      });

      if (!existing) {
        return handleBadRequest({ res, message: "Transaction not found!" });
      }

      const updatedData = await prisma.transactions.update({
        where: { id: existing.id },
        data: {
          amount: amount ? parseFloat(String(amount)) : undefined,
          description: description ? description : undefined,
          mode: mode ? mode : undefined,
          unitValue: unitValue ? unitValue : undefined,
          date: date ? date : undefined,
          status: true,
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
      const deleted = await prisma.transactions.update({
        data: { status: false },
        where: { id: Number(req.query.id) },
      });
      return handleSuccess({
        res,
        message: "Transaction deleted",
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
        result = await prisma.transactions.findFirst({
          where: { id: Number(id), status: true },
        });
        aggregation = await prisma.transactions.aggregate({
          where: { id: Number(id), status: true },
          _count: { id: true },
        });
      } else {
        result = await prisma.transactions.findMany({
          where: { status: true },
          skip,
          take,
        });
        aggregation = await prisma.transactions.aggregate({
          where: { status: true },
          _count: { id: true },
        });
      }

      const rs = await TransactionController.getStats();

      const {
        totalSpent,
        totalSpentPrevious,
        transactionCount,
        transactionCountPrevious,
        percentageDifference,
        difference,
      } = rs
        ? rs
        : {
            totalSpent: null,
            totalSpentPrevious: null,
            transactionCount: null,
            transactionCountPrevious: null,
            percentageDifference: null,
            difference: null,
          };

      const paging = getMeta(req.query, aggregation?._count?.id);

      return handleSuccess({
        res,
        paging,
        data: {
          result,
          totalSpent,
          totalSpentPrevious,
          transactionCount,
          transactionCountPrevious,
          percentageDifference,
          difference,
        },
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
  getStats: async () => {
    try {
      const startDate = new Date(
        moment().startOf("month").format("YYYY-MM-DD")
      );
      const endDate = new Date(moment().endOf("month").format("YYYY-MM-DD"));

      const transactions = await prisma.transactions.aggregate({
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        where: {
          status: true,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const previousTransaction = await prisma.transactions.aggregate({
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        where: {
          status: true,
          date: {
            gte: new Date(startDate.setMonth(startDate.getMonth() - 1)),
            lte: new Date(endDate.setMonth(endDate.getMonth() - 1)),
          },
        },
      });

      const allTransactions = await prisma.transactions.aggregate({
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        where: {
          status: true,
        },
      });

      return {
        totalSpent: allTransactions?._sum?.amount || 0,
        totalSpentPrevious: previousTransaction?._sum?.amount || 0,
        transactionCount: allTransactions?._count?.id || 0,
        transactionCountPrevious: previousTransaction?._count?.id || 0,
        percentageDifference:
          (((previousTransaction?._sum?.amount || 0) -
            (transactions?._sum?.amount || 0)) /
            100) *
          (previousTransaction?._sum?.amount || 0),
        difference:
          (transactions?._sum?.amount || 0) -
          (previousTransaction?._sum?.amount || 0),
      };
    } catch (error) {
      logger.error(error);
      return null;
    }
  },
};
