import { Router } from "express";
import User from "./user.routes";
import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  standardHeaders: false,
  legacyHeaders: false,
});

const router = Router();

router.use("/user", limiter, User);

export default router;
