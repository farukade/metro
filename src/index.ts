import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import allRoutes from "./routes";
import { engine } from "express-handlebars";
import { join } from "path";
import cookieParser from "cookie-parser";
import { loggerMiddleware } from "./utils/middlewares";
import { handleBadRequest } from "./utils/utils";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocket } from "./gateway";
import { config } from "dotenv";
config();

const domain = process.env.SERVER_DOMAIN;
const clientDomain = process.env.CLIENT_URL;

const app = express();
const server = createServer({ maxHeaderSize: 65536 }, app);

let allowedOrigins = [domain, clientDomain];
console.log(`ALLOWED ORIGINS => [${allowedOrigins}]`);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  })
);

app.use(cookieParser());
app.use(express.static(join(__dirname, "../public")));

app.engine("handlebars", engine({ extname: ".hbs" }));
app.set("view engine", "handlebars");
app.set("views", join(__dirname, "../views"));

app.use(loggerMiddleware);

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       console.log(`CLIENT ORIGIN => [${[origin]}]`);
//       // allow requests with no origin (like mobile apps or curl requests)
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) === -1) {
//         let msg =
//           "The CORS policy for this site does not " +
//           "allow access from the specified Origin.";
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//   })
// );

app.use(cors());

/* Routes */
app.use(allRoutes);

app.use(function (req, res) {
  return handleBadRequest({
    res,
    code: 404,
    message: `${req.url} - Endpoint not found!`,
  });
});

export const io = new Server(server);
initSocket();

export default { server, app };
