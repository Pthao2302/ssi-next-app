"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export default function Home() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("--");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);
  const searchTimeout = useRef(null);

  const fetchData = useCallback(async (q = searchQuery, p = page, isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else if (p === 1) setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: p });
      if (q) params.set("q", q);

      const res = await fetch(`/api/data?${params}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP Error: ${res.status}`);
      }

      setData(json.data || []);
      setHeaders(json.headers || []);
      setTotalPages(json.totalPages || 1);
      setTotalRecords(json.total || 0);

      if (json.timestamp) {
        const date = new Date(json.timestamp);
        setLastUpdated(
          date.toLocaleTimeString("vi-VN") + " " + date.toLocaleDateString("vi-VN")
        );
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, page]);

  useEffect(() => {
    fetchData(searchQuery, 1);
  }, []);

  // Debounced search
  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    setPage(1);
    setExpandedRow(null);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchData(q, 1);
    }, 400);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setExpandedRow(null);
    fetchData(searchQuery, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cột hiển thị dạng rút gọn (không phải nội dung đầy đủ)
  const SUMMARY_COL = "Tóm tắt";
  const REVIEW_COL = Object.keys(data[0] || {}).find((h) =>
    h.includes("Review") || h.includes("----")
  );
  const UPDATE_COL = "Cập nhật mới nhất";

  const getShortText = (text, maxLen = 120) => {
    if (!text) return "—";
    const clean = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    return clean.length > maxLen ? clean.slice(0, maxLen) + "…" : clean;
  };

  return (
    <div className="app-container">
      <header className="navbar glass-panel">
        <div className="logo">
          <div className="logo-icon"></div>
          <h1>SSI Insights</h1>
        </div>
        <div className={`status-indicator ${error ? "error" : loading ? "warning" : "success"}`}>
          <span className={`dot ${!error && !loading ? "pulse" : ""}`}></span>
          <span>{error ? "Lỗi kết nối" : loading ? "Đang tải..." : "Dữ liệu Live"}</span>
        </div>
      </header>

      <main className="dashboard">
        {/* Stats */}
        <section className="overview glass-panel fade-in">
          <h2>Tổng Quan</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Tổng số mã</span>
              <span className="stat-value">{totalRecords || "--"}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Đang hiển thị</span>
              <span className="stat-value">{data.length > 0 ? `${data.length} mã` : "--"}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Cập nhật lúc</span>
              <span className="stat-value" style={{ fontSize: "1rem" }}>{lastUpdated}</span>
            </div>
          </div>
        </section>

        {/* Data Table */}
        <section className="data-view glass-panel fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="table-header">
            <h3>Dữ Liệu Thị Trường</h3>
            <div className="table-actions">
              <div className="search-wrapper">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tìm mã CK, ngành..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => handleSearch({ target: { value: "" } })}>×</button>
                )}
              </div>
              <button
                onClick={() => fetchData(searchQuery, page, true)}
                className={`btn-primary ${isRefreshing ? "spinning" : ""}`}
              >
                <span>Làm mới</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                  <path d="M16 21v-5h5"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Đang tải dữ liệu từ Cloudflare Edge...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
                </svg>
                <p>{error}</p>
                <small>Kiểm tra KV đã upload CSV và binding đúng chưa.</small>
              </div>
            ) : data.length === 0 ? (
              <div className="error-state">
                <p>Không tìm thấy dữ liệu{searchQuery ? ` cho "${searchQuery}"` : ""}.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mã CK</th>
                    <th>Ngành</th>
                    <th>Tóm Tắt</th>
                    <th>Đánh Giá / Khuyến Nghị</th>
                    <th>Cập Nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => {
                    const globalIdx = (page - 1) * 100 + i + 1;
                    const isExpanded = expandedRow === i;
                    const ticker = row["Mã CK"] || "—";
                    const industry = row["Ngành"] || "—";
                    const summary = row[SUMMARY_COL] || "—";
                    const review = REVIEW_COL ? row[REVIEW_COL] : "";
                    const updateLog = row[UPDATE_COL] || "";

                    return (
                      <>
                        <tr
                          key={`row-${i}`}
                          className={`data-row ${isExpanded ? "expanded" : ""}`}
                          onClick={() => setExpandedRow(isExpanded ? null : i)}
                        >
                          <td className="col-num">{globalIdx}</td>
                          <td className="col-ticker">
                            <span className="ticker-badge">{ticker}</span>
                          </td>
                          <td className="col-industry">{industry}</td>
                          <td className="col-summary">{getShortText(summary, 150)}</td>
                          <td className="col-review">
                            {getShortText(review, 120)}
                            {review && review.length > 120 && (
                              <span className="expand-hint">{isExpanded ? " ▲ Thu gọn" : " ▼ Xem thêm"}</span>
                            )}
                          </td>
                          <td className="col-update">{getShortText(updateLog, 80)}</td>
                        </tr>
                        {isExpanded && (review || updateLog) && (
                          <tr key={`expand-${i}`} className="expand-row">
                            <td colSpan={6}>
                              <div className="expand-content">
                                {review && (
                                  <div className="expand-section">
                                    <h4>📊 Đánh Giá / Khuyến Nghị</h4>
                                    <div className="expand-text">{review}</div>
                                  </div>
                                )}
                                {updateLog && (
                                  <div className="expand-section">
                                    <h4>📅 Lịch Sử Cập Nhật</h4>
                                    <div className="expand-text">{updateLog}</div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >← Trước</button>

              <div className="page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = idx + 1;
                  else if (page <= 3) pageNum = idx + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + idx;
                  else pageNum = page - 2 + idx;
                  return (
                    <button
                      key={pageNum}
                      className={`page-btn ${page === pageNum ? "active" : ""}`}
                      onClick={() => handlePageChange(pageNum)}
                    >{pageNum}</button>
                  );
                })}
              </div>

              <button
                className="page-btn"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >Sau →</button>

              <span className="page-info">Trang {page}/{totalPages} • {totalRecords} mã</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
