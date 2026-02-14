const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// Multer Config
// =======================
const upload = multer({ dest: "uploads/" });

// =======================
// Health Check Route
// =======================
app.get("/", (req, res) => {
  res.send("Regression Testing Dashboard Backend is Running 🚀");
});

// =======================
// Helper: Read CSV
// =======================
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = {};
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        results[row.TestCaseID] = row.Status;
      })
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

// =======================
// Compare Builds API
// =======================
app.post("/compare", upload.array("files", 2), async (req, res) => {
  try {
    if (!req.files || req.files.length !== 2) {
      return res.status(400).json({
        error: "Please upload exactly 2 CSV files"
      });
    }

    const build1Path = req.files[0].path;
    const build2Path = req.files[1].path;

    const build1 = await readCSV(build1Path);
    const build2 = await readCSV(build2Path);

    let newlyFailed = [];
    let fixed = [];
    let stable = [];
    let existingIssues = [];

    let pass = 0;
    let fail = 0;

    for (let tc in build1) {
      const status1 = build1[tc];
      const status2 = build2[tc];

      if (status1 === "PASS" && status2 === "FAIL") newlyFailed.push(tc);
      else if (status1 === "FAIL" && status2 === "PASS") fixed.push(tc);
      else if (status1 === "PASS" && status2 === "PASS") stable.push(tc);
      else if (status1 === "FAIL" && status2 === "FAIL") existingIssues.push(tc);

      if (status2 === "PASS") pass++;
      if (status2 === "FAIL") fail++;
    }

    // Cleanup uploaded files
    fs.unlinkSync(build1Path);
    fs.unlinkSync(build2Path);

    res.json({
      summary: {
        totalTests: pass + fail,
        pass,
        fail,
        passPercentage: ((pass / (pass + fail)) * 100).toFixed(2),
        failPercentage: ((fail / (pass + fail)) * 100).toFixed(2)
      },
      newlyFailed,
      fixed,
      stable,
      existingIssues
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error processing test result files"
    });
  }
});

// =======================
// Start Server
// =======================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
