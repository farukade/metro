import { Router } from "express";
import { authorize } from "../utils/middlewares";
import { GroupController } from "../controller/contact-group.controller";

const groupRoutes = Router();
const { get, create, remove, update } = GroupController;

groupRoutes.get("/", authorize(["readAll-group"]), get);
groupRoutes.post("/", authorize(["readAll-group"]), create);
groupRoutes.put("/", authorize(["update-group"]), update);
groupRoutes.delete("/", authorize(["delete-group"]), remove);

export default groupRoutes;
