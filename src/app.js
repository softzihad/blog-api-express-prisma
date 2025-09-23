import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { notFound, errorHandler } from "./middlewares/error.js";
import { authRouter} from "./routes/auth.js";
import { categoryRouter } from "./routes/category.js";
import { postRouter } from "./routes/post.js";
import { tagRouter } from "./routes/tag.js";


dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Mount routers
app.use('/auth', authRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/posts', postRouter);
app.use('/api/tags', tagRouter);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;