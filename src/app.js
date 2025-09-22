import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { notFound, errorHandler } from "./middlewares/error.js";
import { authRouter} from "./routes/auth.js";


dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use('/auth', authRouter);


app.use(notFound);
app.use(errorHandler);

export default app;