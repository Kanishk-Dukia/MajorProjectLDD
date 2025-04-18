import fs from "fs";
import fetch from "node-fetch";
import sharp from "sharp";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { marked } from "marked"; // ⬅️ Add this
dotenv.config();

const HF_TOKEN = process.env.HF_TOKEN;
const gemini = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });  // Use your API key here

/**
 * Fetch remedies from the Google Gemini model for a given plant disease.
 */
async function getRemedies(diseaseName) {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.0-flash", // Specify the correct model name
      contents: `Give me 5 simple and effective remedies for the plant disease called "${diseaseName}". Format the response as a numbered list with brief explanations for each remedy.`
    });
    
    const text = response.text; // Return the response text from the model

    const htmlRemedies = marked.parse(text); // ⬅️ Converts markdown to HTML

    return htmlRemedies;
  } catch (error) {
    console.error("Error fetching remedies from Google Gemini:", error);
    return null;
  }
}


/**
 * Ensure the image is in a supported web format.
 * If not (e.g., HEIC), convert to JPEG.
 */
async function prepareImage(buffer, mimeType) {
  const supported = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"];
  if (supported.includes(mimeType)) {
    return { buffer, mimeType };
  }
  // Convert to JPEG
  const converted = await sharp(buffer)
    .jpeg()
    .toBuffer();
  return { buffer: converted, mimeType: "image/jpeg" };
}

async function query(imageBuffer, mimeType) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/marwaALzaabi/plant-disease-detection-vit",
    {
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": mimeType,
      },
      method: "POST",
      body: imageBuffer,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error(`HF API error ${response.status}:`, errText);
    throw new Error(`HF API error ${response.status}`);
  }

  const text = await response.text();
  try {
    const result = JSON.parse(text);
    return result.length > 0 ? result[0] : null;
  } catch (err) {
    console.error("❌ Hugging Face Error Response:\n", text);
    throw err;
  }
}

export async function handleUpload(req, res) {
  let preview = null;

  try {
    if (!req.file) {
        return res.render("home", {
            result: null,
            error: "No file uploaded",
            preview: null,
            remedies: null
          });
    }

    // 1) Read the raw upload
    const rawBuffer = fs.readFileSync(req.file.path);

    // 2) Create a base64 data‑URI for the preview
    preview = `data:${req.file.mimetype};base64,${rawBuffer.toString("base64")}`;

    // 3) Convert if needed and run inference
    const { buffer: imageBuffer, mimeType } = await prepareImage(rawBuffer, req.file.mimetype);
    const result = await query(imageBuffer, mimeType);

    // 4) Format the label for display and get remedies
    let remedies = null;
    if (result) {
      result.formattedLabel = result.label.replace(/_/g, " ").replace(/___/g, " - ");
      remedies = await getRemedies(result.formattedLabel);
    }

    // 5) Render with both result and preview
    res.render("home", {
        result,
        error: null,
        preview: `data:${mimeType};base64,${imageBuffer.toString("base64")}`,
        remedies
      });
      


  } catch (error) {
    res.render("home", {
        result: null,
        error: "Error processing image: " + error.message,
        preview: null,
        remedies: null
      });      
  } finally {
    // 6) Cleanup upload
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
}
