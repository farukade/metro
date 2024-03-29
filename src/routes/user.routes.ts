import { Router } from "express";
import { authorize } from "../utils/middlewares";
import { UserController } from "../controller/user.controller";

const userRoutes = Router();
const {
  login,
  register,
  getAllUser,
  getSingleUser,
  updateSingleUser,
  deleteSingleUser,
  updatePassword,
  getUserByToken,
} = UserController;

userRoutes.post("/login", login);
userRoutes.post("/register", register);
userRoutes.get("/", authorize(["readAll-user"]), getAllUser);
userRoutes.get("/:id", authorize(["readSingle-user"]), getSingleUser);
userRoutes.put("/:id", authorize(["update-user"]), updateSingleUser);
userRoutes.delete("/:id", authorize(["delete-user"]), deleteSingleUser);
userRoutes.patch("/", authorize(["update-user"]), updatePassword);
userRoutes.post("/by/token", getUserByToken);

export default userRoutes;
