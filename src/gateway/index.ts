import { io } from "..";
import { Socket } from "socket.io";
import appGateway from "./app.gateway";
import { logger } from "../utils/logger";

export const initSocket = () => {
  try {
    io.of("/logs").on("connection", (socket: Socket) => {
      logger.info("NEW USER => " + socket.id + " <= CONNECTED");

      appGateway.fetchLogs(socket);

      socket.on("disconnect", () => {
        logger.info("USER => " + socket.id + " <= DISCONNECTED");
      });
    });
  } catch (error) {
    logger.error(error);
  }
};

// export const sendMessageToClient = (message) => {
//   io.emit('message', message);
// }
