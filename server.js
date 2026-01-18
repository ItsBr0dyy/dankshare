import express from "express";
import axios from "axios";
import multer from "multer";
import path from "path";
import FormData from "form-data";
import { fileURLToPath } from "url";

const app = express();
const upload = multer(); // handles multipart/form-data in memory

const PORT = 3000;

// Needed for ES modules to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (CSS, JS, images, favicon) from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Home page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Endpoint for frontend to upload images
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided." });

    // Use Node form-data
    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);

    const kappaResponse = await axios.post("https://kappa.lol/api/upload", formData, {
      headers: formData.getHeaders(), // Important!
    });

    const { id } = kappaResponse.data;
    const imageUrl = `http://localhost:3000/view/${id}`;

    res.json({ id, imageUrl });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to upload image." });
  }
});

// Example route to show image using kappa URL
app.get("/view/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const imageUrl = `https://kappa.lol/${id}`;

    const response = await axios.get(imageUrl, {
      responseType: "stream"
    });

    // Forward content type (png, jpg, gif, etc)
    res.setHeader("Content-Type", response.headers["content-type"]);

    response.data.pipe(res);

  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(404).send("File not found");
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
