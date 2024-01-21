import { Router, Request, Response } from "express";
import {
  asyncMulterMiddleware,
  authorize,
  uploadFile,
} from "../utils/middlewares";
import { handleBadRequest, handleError, handleSuccess } from "../utils/utils";

const uploadRoutes = Router();

uploadRoutes.post(
  "/",
  authorize(["readSingle-user"]),
  asyncMulterMiddleware(uploadFile.any()),
  (req: Request, res: Response) => {
    try {
      if (!req.files) {
        return handleBadRequest({ res, message: "Upload file not found!" });
      }
      const filename = req.files[0]?.filename;
      if (filename) {
        const url = `uploads/${filename}`;
        return handleSuccess({ res, data: { url } });
      } else {
        return handleBadRequest({ res, message: "Upload failed!" });
      }
    } catch (error) {
      return handleError(res, error);
    }
  }
);

export default uploadRoutes;
