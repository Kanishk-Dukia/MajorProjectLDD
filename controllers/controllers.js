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
    "https://router.huggingface.co/hf-inference/models/wambugu71/crop_leaf_diseases_vit",
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
    return result.length > 0 ? result : null;
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
        remedies: null,
      });
    }

    // Read the raw image buffer
    let rawBuffer = fs.readFileSync(req.file.path);
    const originalSize = rawBuffer.length;

    // 🔻 Compress image if it's over 1MB (especially useful for mobile)
    if (originalSize > 1024 * 1024) {
      rawBuffer = await sharp(rawBuffer)
        .jpeg({ quality: 70 }) // You can tweak quality here
        .toBuffer();
    }

    // Preview data URI
    preview = `data:${req.file.mimetype};base64,${rawBuffer.toString("base64")}`;

    // Prepare image for Hugging Face
    const { buffer: imageBuffer, mimeType } = await prepareImage(rawBuffer, req.file.mimetype);
    const results = await query(imageBuffer, mimeType);
    // console.log(results);

    // Get remedies if a condition was detected
    let remedies = "INVALID INPUT";
    if (results && results.length > 0) {
      // Format labels for all
      results.forEach(r => {
        r.formattedLabel = r.label.replace(/_/g, " ").replace(/___/g, " - ");
      });

      if(results[0].label !== "Invalid") {
        // Get remedies only for top prediction
        remedies = await getRemedies(results[0].formattedLabel);
      }
    }


    // Render response
    res.render("home", {
      result: results[0],
      rawResults: results,        // full array for graph
      error: null,
      preview: `data:${mimeType};base64,${imageBuffer.toString("base64")}`,
      remedies,
    });

  } catch (error) {
    res.render("home", {
      result: null,
      rawResults: null,
      error: "Error processing image: " + error.message,
      preview: null,
      remedies: null,
    });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
}
