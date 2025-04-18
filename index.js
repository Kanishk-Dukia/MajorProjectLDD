// server.js
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import routes from "./routes/routes.js"; // ← updated path

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
	fs.mkdirSync("uploads");
}

// View & static config
app.set("view engine", "ejs");
app.use(express.static("public"));

// Use routes
app.use("/", routes);

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
