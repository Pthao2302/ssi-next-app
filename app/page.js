"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("--");

  const fetchData = async () => {
    try {
      setIsSpinning(true);
      setError(null);
      const res = await fetch("/api/data");
      
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      const json = await res.json();
      
      if (json.error) {
        throw new Error(json.error);
      }
      
      setData(json.data);
      if (json.timestamp) {
        const date = new Date(json.timestamp);
        setLastUpdated(date.toLocaleTimeString() + ' ' + date.toLocaleDateString());
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setTimeout(() => setIsSpinning(false), 500);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="app-container">
      <header className="navbar glass-panel">
        <div className="logo">
          <div className="logo-icon"></div>
          <h1>SSI Insights</h1>
        </div>
        <div className={`status-indicator ${error ? 'error' : (loading ? 'warning' : 'success')}`}>
          <span className={`dot ${(!error && !loading) ? 'pulse' : ''}`}></span>
          <span>{error ? 'Connection Failed' : (loading ? 'Connecting...' : 'Live Data')}</span>
        </div>
      </header>

      <main className="dashboard">
        <section className="overview glass-panel fade-in">
          <h2>VN30 Data Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Records</span>
              <span className="stat-value">{data ? data.length : '--'}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Last Updated</span>
              <span className="stat-value">{lastUpdated}</span>
            </div>
          </div>
        </section>

        <section className="data-view glass-panel fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="table-header">
            <h3>Market Data</h3>
            <button onClick={fetchData} className={`btn-primary ${isSpinning ? 'spinning' : ''}`}>
              <span>Refresh Data</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M16 21v-5h5"/>
              </svg>
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {data && data.length > 0 ? (
                    Object.keys(data[0]).map(header => (
                      <th key={header}>{header}</th>
                    ))
                  ) : (
                    <th>Status</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="100%" className="loading-cell">Fetching latest data from Cloudflare Edge...</td></tr>
                ) : error ? (
                  <tr><td colSpan="100%" style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger-color)' }}>{error}<br/><small>Make sure CSV is uploaded to KV and bindings are correct.</small></td></tr>
                ) : data && data.length > 0 ? (
                  data.map((row, i) => (
                    <tr key={i}>
                      {Object.keys(row).map(header => {
                        let val = row[header];
                        const isNum = !isNaN(val) && val !== "";
                        return (
                          <td key={header} style={isNum ? { textAlign: 'right', fontFamily: 'monospace' } : {}}>
                            {val}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="100%" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No data available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
