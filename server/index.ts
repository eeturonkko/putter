import cors from "cors";
import "dotenv/config";
import express from "express";
import sessionsRouter from "./routes/sessions";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/sessions", sessionsRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
