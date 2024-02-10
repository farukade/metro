import { Router } from "express";
import {
  asyncMulterMiddleware,
  authorize,
  uploadFile,
} from "../utils/middlewares";
import { ContactController } from "../controller/contact.controller";

const contactRoutes = Router();
const { get, create, remove, update, upload, uploadTemplate } =
  ContactController;

contactRoutes.get("/", authorize(["readAll-contact"]), get);
contactRoutes.post("/", authorize(["readAll-contact"]), create);
contactRoutes.put("/", authorize(["update-contact"]), update);
contactRoutes.delete("/", authorize(["delete-contact"]), remove);
contactRoutes.post(
  "/upload",
  authorize(["create-contact"]),
  asyncMulterMiddleware(uploadFile.any()),
  upload
);
contactRoutes.get(
  "/download/template",
  authorize(["create-contact"]),
  uploadTemplate
);

export default contactRoutes;
