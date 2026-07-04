import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDatabase } from "./config/database.js";
import quizRouter from "./routes/quiz.js";
import booksRouter from "./routes/books.js";
import chatRouter from "./routes/chat.js";
import chunksRouter from "./routes/chunks.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: "http://127.0.0.1:5173" }));
app.use(express.json());
app.use("/uploads", express.static("public/uploads"));

app.use("/api", booksRouter);
app.use("/api", quizRouter);
app.use("/api", chatRouter);
app.use("/api", chunksRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

async function main() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`ReadQuest API running on http://127.0.0.1:${PORT}`);
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
