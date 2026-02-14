import React, { useState } from "react";
import Papa from "papaparse";
import "./App.css";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { jsPDF } from "jspdf";

function App() {
  const [build1, setBuild1] = useState([]);
  const [build2, setBuild2] = useState([]);
  const [report, setReport] = useState(null);

  const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b"];

  const parseCSV = (file, setter) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => setter(result.data),
    });
  };

  const compareBuilds = () => {
    const map1 = {};
    build1.forEach((t) => {
      map1[`${t.Feature}-${t.Scenario}`] = t.Status;
    });

    const newlyFailed = [];
    const fixed = [];
    const stable = [];
    const stillFailing = [];

    let pass = 0;
    let fail = 0;

    build2.forEach((t) => {
      const key = `${t.Feature}-${t.Scenario}`;
      const prev = map1[key];
      const curr = t.Status;

      if (curr === "PASS") pass++;
      if (curr === "FAIL") fail++;

      if (prev === "PASS" && curr === "FAIL") newlyFailed.push(t);
      else if (prev === "FAIL" && curr === "PASS") fixed.push(t);
      else if (prev === "FAIL" && curr === "FAIL") stillFailing.push(t);
      else if (prev === "PASS" && curr === "PASS") stable.push(t);
    });

    setReport({
      pass,
      fail,
      newlyFailed,
      fixed,
      stillFailing,
      stable,
    });
  };

  // ---------------- PDF Download ----------------
  const downloadPDFReport = () => {
    if (!report) {
      alert("Compare builds first 😄");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41);
    doc.text("Regression Testing Report", 14, 20);

    const headers = ["Feature", "Scenario", "Status", "Result"];
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);

    let y = 30;
    doc.setFillColor(63, 81, 181);
    doc.rect(14, y - 8, 180, 10, "F");
    headers.forEach((h, i) => {
      doc.text(h, 18 + i * 45, y);
    });
    y += 10;

    const allTests = [
      ...report.stable,
      ...report.newlyFailed,
      ...report.fixed,
      ...report.stillFailing,
    ];

    allTests.forEach((t) => {
      const type = report.stable.includes(t)
        ? "Stable"
        : report.newlyFailed.includes(t)
        ? "Newly Failed"
        : report.fixed.includes(t)
        ? "Fixed"
        : "Still Failing";

      if (type === "Stable") doc.setTextColor(34, 197, 94);
      else if (type === "Newly Failed") doc.setTextColor(239, 68, 68);
      else if (type === "Fixed") doc.setTextColor(250, 204, 21);
      else doc.setTextColor(239, 68, 68);

      doc.text(t.Feature, 18, y);
      doc.text(t.Scenario, 63, y);
      doc.text(t.Status, 108, y);
      doc.text(type, 153, y);

      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("regression-report.pdf");
  };

  // ---------------- UI ----------------
  if (!report) {
    return (
      <div className="app">
        <h1>Regression Testing Dashboard</h1>

        <div className="upload-card">
          <div>
            <label>Build-1 CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => parseCSV(e.target.files[0], setBuild1)}
            />
          </div>

          <div>
            <label>Build-2 CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => parseCSV(e.target.files[0], setBuild2)}
            />
          </div>

          <button onClick={compareBuilds}>🔍 Compare Builds</button>
        </div>
      </div>
    );
  }

  const barData = [
    { name: "Passed", value: report.pass },
    { name: "Failed", value: report.fail },
  ];

  const pieData = [
    { name: "Stable", value: report.stable.length },
    { name: "Newly Failed", value: report.newlyFailed.length },
    { name: "Fixed", value: report.fixed.length },
    { name: "Still Failing", value: report.stillFailing.length },
  ];

  return (
    <div className="app">
      <h1> Regression Testing Dashboard</h1>

      <div className="grid">
        <div className="card">
          <h2>📊 Build-2 Pass vs Fail</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2> Stability Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={90} label>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card full">
        <h3>📌 Regression Summary (Build-2)</h3>

        <div className="summary-grid">
          <div className="summary-box fail">
            <h4>❌ Newly Failed</h4>
            {report.newlyFailed.map((t, i) => (
              <p key={i}>
                <strong>{t.Feature}</strong> — {t.Scenario}
              </p>
            ))}
          </div>

          <div className="summary-box fixed">
            <h4>🟡 Fixed</h4>
            {report.fixed.map((t, i) => (
              <p key={i}>
                <strong>{t.Feature}</strong> — {t.Scenario}
              </p>
            ))}
          </div>

          <div className="summary-box warn">
            <h4>🔁 Still Failing</h4>
            {report.stillFailing.map((t, i) => (
              <p key={i}>
                <strong>{t.Feature}</strong> — {t.Scenario}
              </p>
            ))}
          </div>

          <div className="summary-box stable">
            <h4>✅ Stable</h4>
            {report.stable.map((t, i) => (
              <p key={i}>
                <strong>{t.Feature}</strong> — {t.Scenario}
              </p>
            ))}
          </div>
        </div>

        <div className="download-buttons">
          <button onClick={downloadPDFReport}>⬇️ Download PDF Report</button>
        </div>
      </div>
    </div>
  );
}

export default App;
