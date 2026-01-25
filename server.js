import express from "express";
import axios from "axios";
import multer from "multer";
import path from "path";
import FormData from "form-data";
import { fileURLToPath } from "url";
import cors from "cors";

const app = express();
const upload = multer();
const PORT = 3000;
const BASE_URL = "https://dankshare.itsbr0dyy.dev";

// ES modules __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const uploadFields = upload.fields([{ name: "image", maxCount: 1 }, { name: "file", maxCount: 1 }]);

app.post("/api/upload", uploadFields, async (req, res) => {
  try {
    const file = req.files?.image?.[0] || req.files?.file?.[0];

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const formData = new FormData();
    formData.append("file", file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });

    const headers = formData.getHeaders();

    const kappaResponse = await axios.post(
      "https://kappa.lol/api/upload",
      formData,
      { headers }
    );

    const id = kappaResponse.data.id;
    const imageUrl = `https://dankshare.itsbr0dyy.dev/${id}`;

    res.json({ id, imageUrl, link: imageUrl });

  } catch (err) {
    console.error("Upload error:", err.response?.data || err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (
      id === "api" ||
      id === "favicon.ico"
    ) {
      return res.status(404).end();
    }

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
