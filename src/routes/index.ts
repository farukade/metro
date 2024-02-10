import { Router } from "express";
import User from "./user.routes";
import Upload from "./upload.route";
import Transaction from "./transaction.route";
import Contact from "./contact.route";
import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  standardHeaders: false,
  legacyHeaders: false,
});

const router = Router();

router.use("/user", limiter, User);
router.use("/transaction", Transaction);
router.use("/contact", Contact);
router.use("/upload", Upload);

export default router;
