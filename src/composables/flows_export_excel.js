import * as XLSX from "xlsx";
import moment from 'moment';

// auto column width based on content
function fitToColumns(rows) {
  const cols = rows[0] ? rows[0].length : 0;
  const maxLens = Array(cols).fill(0);
  rows.forEach(r => {
    r.forEach((v, i) => {
      const len = String(v ?? "").length;
      if (len > maxLens[i]) maxLens[i] = len;
    });
  });
  return maxLens.map(l => ({ wch: Math.min(Math.max(l + 2, 12), 60) }));
}

function deliveryDateTime(delivery_time){
  return moment(delivery_time).format('dddd, MMMM DD, YYYY HH:mm:ss');
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

export function exportResponsesToExcel(data, filename = "responses.xlsx") {
  const rows = Array.isArray(data) ? data : [data];

  // 1) union of all keys in answers (preserve first-seen order)
  const answerKeys = [];
  rows.forEach(r => {
    const a = (r && r.answers) || {};
    Object.keys(a).forEach(k => {
      if (!answerKeys.includes(k)) answerKeys.push(k);
    });
  });

  // 2) header
  const header = ["flow_name", "recipient_name", "recipient_phone_number", "submitted_at", ...answerKeys];

  // 3) body
  const body = rows.map(r => {
    const out = [];
    out.push(r.flow_name ?? "");
    out.push(r.recipient_name ?? "");
    out.push(r.recipient_phone_number ?? "");
    out.push(deliveryDateTime(r.submitted_at) ?? "");

    answerKeys.forEach(k => {
      let v = (r.answers || {})[k];
      if (Array.isArray(v)) v = v.join(", ");
      else if (v && typeof v === "object") v = JSON.stringify(v);
      else if (typeof v === "string" && ISO_RE.test(v)) {
        // keep ISO, or convert if you like:
        v = deliveryDateTime(v)
        console.log(v)
      }
      out.push(v ?? "");
    });

    return out;
  });

  // 4) sheet & file
  const aoa = [header, ...body];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = fitToColumns(aoa);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Responses");
  XLSX.writeFile(wb, filename);
}