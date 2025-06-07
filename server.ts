import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

const app = express();
const port = process.env.PORT || 3000;

// API Key authentication middleware
const authenticateApiKey = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  const expectedApiKey = process.env.API_KEY;

  if (!expectedApiKey) {
    res
      .status(500)
      .json({ error: "Server configuration error: API_KEY not set" });
    return;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error:
        "Missing or invalid Authorization header. Expected: Bearer <API_KEY>",
    });
    return;
  }

  const providedApiKey = authHeader.slice(7); // Remove 'Bearer ' prefix

  if (providedApiKey !== expectedApiKey) {
    res.status(403).json({ error: "Invalid API key" });
    return;
  }

  next();
};

const authenticateBasic = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  const expectedUsername = process.env.BASIC_AUTH_USERNAME;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    res.status(500).json({
      error: "Server configuration error: Basic auth credentials not set",
    });
    return;
  }

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.set('WWW-Authenticate', 'Basic realm="PDF Processor"');
    res.status(401).send('Authentication required');
    return;
  }

  const base64Credentials = authHeader.slice(6); // Remove 'Basic ' prefix
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii",
  );
  const [username, password] = credentials.split(":");

  if (username !== expectedUsername || password !== expectedPassword) {
    res.set('WWW-Authenticate', 'Basic realm="PDF Processor"');
    res.status(401).send('Invalid credentials');
    return;
  }

  next();
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    const uploadDir = "./uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_, __, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `input-${uniqueSuffix}.pdf`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (_, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed") as any, false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Create necessary directories
const uploadDir = "./uploads";
const outputDir = "./output";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

app.get("/test", authenticateBasic, (_, res) => {
  res.sendFile(path.join(__dirname, "test.html"));
});

// Health check endpoint
app.get("/health", authenticateBasic, (_, res) => {
  res
    // .status(200)
    .json({ status: "OK", message: "PDF processing API is running" });
});

// PDF processing endpoint
app.post(
  "/process-pdf",
  authenticateApiKey,
  upload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      const inputPath = req.file.path;
      const outputFileName = `output-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
      const outputPath = path.join(outputDir, outputFileName);

      // Execute pdftk command to extract page 2
      const command = `pdftk "${inputPath}" cat 2 output "${outputPath}"`;

      try {
        await execAsync(command);

        // Check if output file was created
        if (!fs.existsSync(outputPath)) {
          throw new Error(
            "Output file was not created. The PDF might not have a second page.",
          );
        }

        // Send the processed PDF file
        return res.download(outputPath, "processed.pdf", (err) => {
          // Clean up files after download
          fs.unlink(inputPath, () => {}); // Remove input file
          if (!err) {
            fs.unlink(outputPath, () => {}); // Remove output file after successful download
          }
        });
      } catch (execError) {
        // Clean up input file
        fs.unlink(inputPath, () => {});

        const errorMessage =
          execError instanceof Error ? execError.message : "Unknown error";

        if (errorMessage.includes("ERRORS")) {
          return res.status(400).json({
            error:
              "PDF processing failed. The PDF might not have a second page or might be corrupted.",
            details: errorMessage,
          });
        }

        return res.status(500).json({
          error: "Failed to process PDF with pdftk",
          details: errorMessage,
        });
      }
    } catch (error) {
      // Clean up input file if it exists
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, () => {});
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({
        error: "Internal server error",
        details: errorMessage,
      });
    }
  },
);

// Error handling middleware
app.use(
  (
    error: any,
    _: express.Request,
    res: express.Response,
    __: express.NextFunction,
  ): void => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res
          .status(400)
          .json({ error: "File too large. Maximum size is 10MB." });
        return;
      }
    }

    if (error.message === "Only PDF files are allowed") {
      res.status(400).json({ error: "Only PDF files are allowed" });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  },
);

// Start server
app.listen(port, () => {
  console.log(`PDF processing API server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Process PDF: POST http://localhost:${port}/process-pdf`);
  console.log(`Test interface: http://localhost:${port}/test`);
});

export default app;
