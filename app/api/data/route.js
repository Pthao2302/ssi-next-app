import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { env } = getRequestContext();
    
    if (!env || !env.SSI_DATA) {
      const keys = env ? Object.keys(env).join(', ') : 'null';
      return new Response(JSON.stringify({ 
        error: `KV Binding 'SSI_DATA' missing. Available keys: [${keys}]. Please check Cloudflare Pages Settings -> Bindings -> KV for BOTH Production and Preview.` 
      }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" }
      });
    }

    // Đọc dữ liệu CSV từ KV Namespace "SSI_DATA"
    const csvData = await env.SSI_DATA.get("dataSSI");
    
    if (!csvData) {
      return new Response(JSON.stringify({ error: "Không tìm thấy dữ liệu CSV trên KV" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" }
      });
    }

    // Chuyển đổi CSV sang JSON
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];
    
    for(let i = 1; i < lines.length; i++){
        const obj = {};
        const currentline = lines[i].split(',');
        if(!currentline[0]) continue;
        
        for(let j = 0; j < headers.length; j++){
            const val = currentline[j] ? currentline[j].replace(/^"|"$/g, '').trim() : "";
            obj[headers[j]] = val;
        }
        result.push(obj);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      total: result.length,
      timestamp: new Date().toISOString(),
      data: result 
    }), {
      headers: { "Content-Type": "application/json;charset=UTF-8" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" }
    });
  }
}
