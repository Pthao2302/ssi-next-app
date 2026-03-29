import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

/**
 * Parser CSV chuẩn RFC 4180 - xử lý đúng dấu ngoặc kép và xuống dòng trong field
 */
function parseCSV(csvText) {
  const results = [];
  let i = 0;
  const len = csvText.length;

  // Bỏ qua BOM nếu có
  if (csvText.charCodeAt(0) === 0xFEFF) i = 1;

  // Parse header từ dòng đầu
  const headers = [];
  while (i < len && csvText[i] !== '\n' && csvText[i] !== '\r') {
    headers.push(parseField());
    if (i < len && csvText[i] === ',') i++;
  }
  // Bỏ qua ký tự xuống dòng
  if (i < len && csvText[i] === '\r') i++;
  if (i < len && csvText[i] === '\n') i++;

  // Parse các dòng dữ liệu
  while (i < len) {
    const row = {};
    let hasData = false;

    for (let h = 0; h < headers.length; h++) {
      const val = parseField();
      row[headers[h]] = val;
      if (val) hasData = true;
      if (i < len && csvText[i] === ',') i++;
    }

    // Bỏ qua ký tự xuống dòng cuối dòng
    if (i < len && csvText[i] === '\r') i++;
    if (i < len && csvText[i] === '\n') i++;

    if (hasData) results.push(row);
  }

  return { headers, results };

  function parseField() {
    if (i >= len) return '';

    // Field có dấu ngoặc kép
    if (csvText[i] === '"') {
      i++; // bỏ dấu " mở
      let field = '';
      while (i < len) {
        if (csvText[i] === '"') {
          if (i + 1 < len && csvText[i + 1] === '"') {
            // Dấu ngoặc kép escape: "" → "
            field += '"';
            i += 2;
          } else {
            i++; // bỏ dấu " đóng
            break;
          }
        } else {
          field += csvText[i];
          i++;
        }
      }
      return field.trim();
    }

    // Field không có ngoặc kép - đọc đến dấu , hoặc xuống dòng
    let start = i;
    while (i < len && csvText[i] !== ',' && csvText[i] !== '\n' && csvText[i] !== '\r') {
      i++;
    }
    return csvText.slice(start, i).trim();
  }
}

export async function GET(request) {
  try {
    const { env } = getRequestContext();

    if (!env || !env.SSI_DATA) {
      const keys = env ? Object.keys(env).join(', ') : 'null';
      return Response.json({
        error: `KV Binding 'SSI_DATA' không tìm thấy. Bindings hiện có: [${keys}]. Vui lòng kiểm tra Settings → Bindings trong Cloudflare Pages.`
      }, { status: 500 });
    }

    // Đọc CSV từ KV
    const csvData = await env.SSI_DATA.get('dataSSI');

    if (!csvData) {
      return Response.json({
        error: 'Chưa có dữ liệu CSV trong KV. Hãy chạy skill.bat để upload dataSSI.csv lên KV.'
      }, { status: 404 });
    }

    // Lấy tham số tìm kiếm từ URL
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get('q')?.toLowerCase() || '';
    const pageStr = url.searchParams.get('page') || '1';
    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const pageSize = 100; // Trả về 100 dòng mỗi lần

    // Parse CSV
    const { headers, results } = parseCSV(csvData);

    // Lọc theo từ khóa tìm kiếm
    let filtered = results;
    if (searchQuery) {
      filtered = results.filter(row => {
        const ticker = (row['Mã CK'] || '').toLowerCase();
        const industry = (row['Ngành'] || '').toLowerCase();
        const summary = (row['Tóm tắt'] || '').toLowerCase();
        return ticker.includes(searchQuery) ||
               industry.includes(searchQuery) ||
               summary.includes(searchQuery);
      });
    }

    // Phân trang
    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const startIdx = (page - 1) * pageSize;
    const pageData = filtered.slice(startIdx, startIdx + pageSize);

    return Response.json({
      success: true,
      total: totalRecords,
      page,
      totalPages,
      pageSize,
      timestamp: new Date().toISOString(),
      headers,
      data: pageData,
    }, {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Cache-Control': 'public, max-age=300', // Cache 5 phút
      }
    });

  } catch (err) {
    console.error('API Error:', err);
    return Response.json({
      error: `Lỗi server: ${err.message}`,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
