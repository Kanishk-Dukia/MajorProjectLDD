# 🌿 Plant Disease Detection – Web App

An end-to-end web application for plant disease detection using Vision Transformers. Upload or capture an image of a crop leaf, and our model will return the **top 5 most probable diseases** with confidence scores. This tool is optimized for both desktop and mobile devices, providing accessible AI-powered diagnostics for real-world use.

---

## 🚀 Getting Started

Clone the repository and install dependencies:

```bash
npm install
npm run start


http://localhost:3000


🧪 Sample Screenshots
🔼 Uploading an Image
Easily upload a file or click using your phone camera.

![image](https://github.com/user-attachments/assets/50307310-2820-44a2-8111-3259caa1e2a7)



✅ Prediction Output
Get top-5 classification results with confidence percentages and remedies.

![image](https://github.com/user-attachments/assets/d62fbf34-48b2-4280-ba5e-57b633488e47)




⚙️ Tech Stack
Frontend: HTML, CSS, JavaScript

Backend: Node.js + Express

Model: Vision Transformer (ViT-Large-Patch16-224-in21k) via HuggingFace + Timm

Deployment: Optimized for mobile-first usage and edge-level inference



🧠 Model Highlights
Fine-tuned ViT on 250,000+ real and synthetic leaf images

Trained with field variations: lighting, angles, occlusion

Cross-dataset accuracy: 88%, outperforming CNN baselines

Supports 13+ crop disease categories across corn, potato, rice, and wheat



📂 Dataset Sources
PlantVillage Dataset (38 classes, 87K images)

AI Crowd Plant Pathology

Field-collected and augmented private data



🙌 Authors
Utsav Gupta
Kanishk Dukia
Aditya Vikram Singh
Prateek Palsaniya

