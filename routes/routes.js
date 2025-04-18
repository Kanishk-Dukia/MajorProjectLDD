// routes/routes.js
import express from "express";
import multer from "multer";
import path from "path";
import { handleUpload } from "../controllers/controllers.js";

const router = express.Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, "uploads/"),
	filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.get("/", (req, res) => {
	res.render("home", { result: null, error: null, preview: null,remedies: null });
});

router.post("/upload", upload.single("image"), handleUpload);

export default router;
