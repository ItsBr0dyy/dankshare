import express from "express";
import axios from "axios";
import multer from "multer";
import path from "path";
import FormData from "form-data";
import { fileURLToPath } from "url";
import cors from "cors";

const app = express();
const upload = multer(); // handles multipart/form-data in memory
const PORT = 3000;
const BASE_URL = "https://dankshare.itsbr0dyy.dev";

// ES modules __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable CORS so Chatterino or other clients can call API
app.use(cors());

// Serve static files (CSS, JS, images, favicon) from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Home page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Upload endpoint for frontend or Chatterino
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const formData = new FormData();

    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const headers = formData.getHeaders();

    const kappaResponse = await axios.post(
      "https://kappa.lol/api/upload",
      formData,
      { headers }
    );

    const id = kappaResponse.data.id;
    const imageUrl = `https://dankshare.itsbr0dyy.dev/view/${id}`;

    // UNIVERSAL RESPONSE (Frontend + Chatterino)
    res.json({
      id,
      imageUrl,     // frontend
      link: imageUrl // chatterino
    });

  } catch (err) {
    console.error("Upload error:", err.response?.data || err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Example route to show image using kappa URL
app.get("/view/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const imageUrl = `https://kappa.lol/${id}`;

    const response = await axios.get(imageUrl, {
      responseType: "stream",
    });

    res.setHeader("Content-Type", response.headers["content-type"]);
    response.data.pipe(res);

  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(404).send("File not found");
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
