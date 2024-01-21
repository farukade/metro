import { Router } from "express";
import { authorize } from "../utils/middlewares";
import { TransactionController } from "../controller/transaction.controller";

const transactionRoutes = Router();
const { get, create, remove } = TransactionController;

transactionRoutes.get("/", authorize(["readAll-transaction"]), get);
transactionRoutes.post("/", authorize(["readAll-transaction"]), create);
transactionRoutes.delete("/", authorize(["delete-transaction"]), remove);

export default transactionRoutes;
