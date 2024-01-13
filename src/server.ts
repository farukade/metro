import index from "./index";
import { config } from "dotenv";
import { logger } from "./utils/logger";
const { server } = index;

config();
const PORT = process.env.PORT || 5000;
const domain = process.env.SERVER_DOMAIN;

logger.info(process.env.NODE_ENV);

// run server depending on environment
if (process.env.NODE_ENV === "production") {
  // https
  //   .createServer(
  //     {
  //       // key: fs.readFileSync("/etc/letsencrypt/live/lfix.us/privkey.pem"),
  //       // cert: fs.readFileSync("/etc/letsencrypt/live/lfix.us/fullchain.pem"),
  //     },
  //     app
  //   )
  server.listen(PORT, () => {
    logger.info(`Server is running on production port ${PORT}`);
  });
} else {
  server.listen(PORT, () => {
    logger.info(`
      🚀 Techtink's ERP Server ready at: ${domain} 
      ⭐️ See API documentations: `);
  });
}
