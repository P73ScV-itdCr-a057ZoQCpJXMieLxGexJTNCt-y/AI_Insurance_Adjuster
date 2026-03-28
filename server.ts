import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// Mock database for claims
const claims: Record<string, any> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Multer setup for file uploads
  const upload = multer({ storage: multer.memoryStorage() });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Submit a new claim
  app.post("/api/claims", upload.array("photos"), (req, res) => {
    const { policy_number, vin, description } = req.body;
    const claimId = uuidv4();
    
    // Create initial claim state
    claims[claimId] = {
      id: claimId,
      policy_number,
      vin,
      description,
      status: "processing",
      createdAt: new Date().toISOString(),
      photos: (req.files as any[] || []).map((f, i) => ({
        id: i,
        name: f.originalname,
        size: f.size,
      })),
      results: null,
    };

    // Simulate AI processing (5.8s average as per presentation)
    setTimeout(() => {
      if (claims[claimId]) {
        claims[claimId].status = "completed";
        claims[currentClaimIdToUpdate(claimId)].results = generateMockResults(vin);
      }
    }, 5800);

    res.json({ claimId, status: "processing" });
  });

  function currentClaimIdToUpdate(id: string) { return id; }

  // Get claim status/report
  app.get("/api/claims/:id", (req, res) => {
    const claim = claims[req.params.id];
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }
    res.json(claim);
  });

  // List all claims
  app.get("/api/claims", (req, res) => {
    res.json(Object.values(claims));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

function generateMockResults(vin: string) {
  const fraudScore = Math.floor(Math.random() * 100);
  const p50 = 1500 + Math.floor(Math.random() * 3000);
  
  return {
    damage_detection: {
      mAP: 0.87,
      classes_found: ["dent", "scratch"],
      annotations: [
        { class: "dent", severity: "moderate", panel: "front_left_door", confidence: 0.91 },
        { class: "scratch", severity: "minor", panel: "front_left_door", confidence: 0.85 }
      ]
    },
    cost_estimation: {
      p10: Math.floor(p50 * 0.7),
      p50: p50,
      p90: Math.floor(p50 * 1.45),
      currency: "USD",
      total_loss_flag: p50 > 15000
    },
    fraud_scoring: {
      score: fraudScore,
      disposition: fraudScore < 40 ? "auto-approve" : fraudScore < 70 ? "adjuster-review" : "siu-referral",
      signals: ["ELA JPEG artifacts", "Impact geometry check passed"]
    },
    vin_data: {
      vin,
      make: "Toyota",
      model: "Camry",
      year: 2022
    }
  };
}

startServer();
