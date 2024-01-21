import { Response, Request } from "express";
import {
  getMeta,
  getPagination,
  handleBadRequest,
  handleError,
  handleSuccess,
  prisma,
} from "../utils/utils";
import { config } from "dotenv";
import * as bcrypt from "bcrypt";
import { ILogin, IUser } from "../interfaces/user.interface";
import { encodeToken } from "../utils/middlewares";
import moment from "moment";
import { TransactionController } from "./transaction.controller";
config();

const saltRounds = +process.env.SALT_ROUNDS;

export const UserController = {
  login: async (req: Request, res: Response) => {
    try {
      const body: ILogin = req.body;
      const { email, password } = body;

      const allUser = await prisma.user.findMany({
        where: { status: true },
      });
      const user = allUser.find(
        (u) => u.email === email && bcrypt.compareSync(password, u.password)
      );

      if (user) {
        const token = encodeToken({
          id: user.id,
          email,
        });

        const { password, ...userWithoutPassword } = user;

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

        return handleSuccess({
          res,
          data: {
            ...userWithoutPassword,
            totalSpent,
            totalSpentPrevious,
            transactionCount,
            transactionCountPrevious,
            percentageDifference,
            difference,
            token,
          },
        });
      }
      handleBadRequest({ res, message: "Username or password is incorrect" });
    } catch (error: any) {
      handleError(res, error);
    }
  },
  register: async (req: Request, res: Response) => {
    try {
      const body: IUser = req.body;
      const { firstName, lastName, email, passwordConfirmation } = body;

      const existingEmail = await prisma.user.findFirst({
        where: { email: email.trim().toLowerCase() },
      });

      if (body.password !== passwordConfirmation) {
        return handleBadRequest({ res, message: "Password mismatch!" });
      }
      if (existingEmail) {
        return handleBadRequest({ res, message: "Email. exists!" });
      }

      const hash = await bcrypt.hash(req.body.password, saltRounds);
      const createUser = await prisma.user.create({
        data: {
          firstName,
          lastName,
          password: hash,
          email: email.trim().toLowerCase(),
        },
      });
      const { password, ...userWithoutPassword } = createUser;
      handleSuccess({ res, data: userWithoutPassword });
    } catch (error) {
      handleError(res, error);
    }
  },
  getAllUser: async (req: Request, res: Response) => {
    const { skip, take } = getPagination(req.query);

    try {
      const allUser = await prisma.user.findMany({
        skip,
        take,
      });

      const aggregations = await prisma.user.aggregate({
        _count: {
          id: true,
        },
      });

      const getAllUser = allUser
        .map((u) => {
          const { password, ...userWithoutPassword } = u;
          return userWithoutPassword;
        })
        .sort((a, b) => a.id - b.id);

      const totalUser = aggregations._count.id;
      const paging = getMeta(req.query, totalUser);

      return handleSuccess({ res, data: getAllUser, paging });
    } catch (error) {
      return handleError(res, error);
    }
  },
  getSingleUser: async (req: Request, res: Response) => {
    const singleUser = await prisma.user.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });
    if (!singleUser)
      return handleBadRequest({ res, message: "user not found" });
    const { password, ...userWithoutPassword } = singleUser;
    handleSuccess({ res, data: userWithoutPassword });
  },
  updateSingleUser: async (req: Request, res: Response) => {
    try {
      const body: Partial<IUser> = req.body;
      const {
        password,
        idNo,
        email,
        roleId,
        phone,
        address,
        image,
        ...restBody
      } = body;

      let data: any = {
        idNo: idNo ? idNo : undefined,
        phone: phone ? phone : undefined,
        address: address ? address : undefined,
        image: image ? image : undefined,
      };

      if (req.body.clientId) {
        return handleBadRequest({ res, message: "Bad request!" });
      }

      const user = await prisma.user.findFirst({
        where: {
          id: Number(req.params.id),
        },
      });

      if (!user) {
        return handleBadRequest({ res, message: "User not found!" });
      }

      if (email && email !== "") {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: email?.trim()?.toLowerCase(),
          },
        });

        if (existingUser && existingUser.id !== Number(req.params.id)) {
          return handleBadRequest({
            res,
            message: `User with ${email.trim().toLowerCase()} exists!`,
          });
        }
        data.email = email.trim().toLowerCase();
      }

      if (idNo && idNo !== "") {
        const existingUser = await prisma.user.findFirst({
          where: {
            idNo: String(idNo),
          },
        });

        if (existingUser && existingUser.id !== Number(req.params.id)) {
          return handleBadRequest({
            res,
            message: `User with ${idNo} exists!`,
          });
        }
        data.idNo = String(idNo);
      }

      if (restBody.firstName || restBody.lastName) {
        data.firstName = restBody.firstName || undefined;
        data.lastName = restBody.lastName || undefined;
      }

      //update user for password
      if (password) {
        const hash = await bcrypt.hash(req.body.password, saltRounds);
        await prisma.user.update({
          where: {
            id: Number(req.params.id),
          },
          data: {
            password: hash,
          },
        });
        return handleSuccess({ res, message: "Password updated successfully" });
      } else {
        if (await data) {
          const updateUser = await prisma.user.update({
            where: {
              id: Number(req.params.id),
            },
            data,
          });

          const { password, ...userWithoutPassword } = updateUser;
          return handleSuccess({ res, data: userWithoutPassword });
        } else {
          return handleBadRequest({ res, message: "Unexpected error!" });
        }
      }
    } catch (error) {
      return handleError(res, error);
    }
  },
  deleteSingleUser: async (req: Request, res: Response) => {
    try {
      const deleteUser = await prisma.user.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          status: req.body.status,
        },
      });

      if (!deleteUser)
        return handleBadRequest({ res, message: "User not deleted" });
      handleSuccess({ res, message: "User deleted successfully" });
    } catch (error) {
      handleError(res, error);
    }
  },
};
