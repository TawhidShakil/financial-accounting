import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";

const port = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI missing in .env");
  process.exit(1);
}

await connectDB(process.env.MONGODB_URI);

app.listen(port, () => {
  console.log(`Server Listening on port ${port}`);
});
