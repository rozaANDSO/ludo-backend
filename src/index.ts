import * as dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import socketServer from "./socket/socket.server";
import mongoose from "mongoose";
import router from "./routes/auth.route";
import feedbackroute from "./routes/feedbackRouter";
import { errorHandler } from "./middleware/errorhandler.middleware";

const app = express();

require("dotenv").config();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://marvelous-starlight-d53fef.netlify.app",
      "https://nextludo.com",
    ],
    credentials: true,
  })
);
if (!process.env.MONGO) {
  console.log("mongodb src not supplied");
} else {
  mongoose.connect(process.env.MONGO).catch((err) => console.error(err));
}

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(router);
app.use("/api/feedback", feedbackroute);

app.use(errorHandler);
const server = http.createServer(app);

socketServer(server);
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});
