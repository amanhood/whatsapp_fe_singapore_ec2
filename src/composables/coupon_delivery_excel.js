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
  const header = ["recipient", "delivered_at", "campaign name","form name","coupon code","status","failed reason"];

  // 3) body
  const body = rows.map(r => {
    const out = [];
    out.push(r.recipient ?? "");
    out.push(deliveryDateTime(r.delivered_at) ?? "");
    out.push(r.campaign_name ?? "");
    out.push(r.form_name ?? "");
    out.push(r.coupon_name ?? "");
    out.push(r.status ?? "");
    out.push(r.failed_reason ?? "");


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