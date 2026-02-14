import React, { useState } from "react";
import Papa from "papaparse";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./App.css";

const COLORS = ["#ef4444", "#22c55e", "#3b82f6"];

function App() {
  const [build1, setBuild1] = useState([]);
  const [build2, setBuild2] = useState([]);
  const [result, setResult] = useState(null);

  const parseCSV = (file, setter) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => setter(res.data),
    });
  };

  const compareBuilds = () => {
    const map1 = {};
    build1.forEach((t) => (map1[t.testcase] = t.status));

    let passed = 0,
      failed = 0;
    const newlyFailed = [];
    const fixed = [];
    const stable = [];

    build2.forEach((t) => {
      const prev = map1[t.testcase];

      if (t.status === "Pass") passed++;
      else failed++;

      if (prev === "Pass" && t.status === "Fail")
        newlyFailed.push(t.testcase);
      else if (prev === "Fail" && t.status === "Pass")
        fixed.push(t.testcase);
      else stable.push(t.testcase);
    });

    setResult({
      passed,
      failed,
      newlyFailed,
      fixed,
      stable,
    });
  };

  return (
    <div className="app">
      <h1>🧪 Regression Testing Dashboard</h1>
      <p className="subtitle">
        Compare regression results between software builds
      </p>

      <div className="upload-card">
        <div>
          <label>Build-1 CSV</label>
          <input
            type="file"
            onChange={(e) => parseCSV(e.target.files[0], setBuild1)}
          />
        </div>

        <div>
          <label>Build-2 CSV</label>
          <input
            type="file"
            onChange={(e) => parseCSV(e.target.files[0], setBuild2)}
          />
        </div>

        <button className="primary-btn" onClick={compareBuilds}>
          🔍 Compare Builds
        </button>
      </div>

      {result && (
        <>
          <div className="grid">
            <div className="card">
              <h2>📊 Build-2 Pass vs Fail</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={[
                    { name: "Passed", value: result.passed },
                    { name: "Failed", value: result.failed },
                  ]}
                >
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2>🥧 Stability Distribution</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Newly Failed", value: result.newlyFailed.length },
                      { name: "Fixed", value: result.fixed.length },
                      { name: "Stable", value: result.stable.length },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {COLORS.map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid">
            <div className="card danger">
              <h3>❌ Newly Failed (Build-2)</h3>
              <ul>
                {result.newlyFailed.length
                  ? result.newlyFailed.map((t) => <li key={t}>{t}</li>)
                  : <li>None 🎉</li>}
              </ul>
            </div>

            <div className="card success">
              <h3>✅ Fixed</h3>
              <ul>
                {result.fixed.length
                  ? result.fixed.map((t) => <li key={t}>{t}</li>)
                  : <li>None</li>}
              </ul>
            </div>

            <div className="card info">
              <h3>🟢 Stable</h3>
              <ul>
                {result.stable.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
