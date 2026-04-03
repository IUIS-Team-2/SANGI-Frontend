import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export async function exportIPDExcel(patients, locName = "Hospital") {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("IPD Records");

  ws.mergeCells("A1:P1");
  const title = ws.getCell("A1");
  title.value = `🏥  ${locName} — IPD RECORDS  |  ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`;
  title.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 14, name: "Arial" };
  title.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2B55" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 32;

  const headers = ["SR.NO","PATIENT NAME","AGE / GENDER","IPD NO","CARD NO","ROOM","DOA","DOD","STAY","TYPE","TYPE REF","CONSULTING DOCTOR","NUMBER","ADDRESS","DISCHARGE STATUS","BILL STATUS"];
  const headerRow = ws.addRow(headers);
  headerRow.height = 36;
  headerRow.eachCell(cell => {
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 9, name: "Arial" };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A3C6E" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border    = { top: s("medium"), bottom: s("medium"), left: s("medium"), right: s("medium") };
  });

  const ROW_COLORS = ["FFD6E4F7", "FFFFF8E7"];
  patients.forEach((p, i) => {
    const adm = p.admObj || {};
    const bg  = ROW_COLORS[i % 2];
    const row = ws.addRow([
      i + 1,
      p.patientObj?.name || "",
      `${p.patientObj?.age || ""} Yrs / ${p.patientObj?.gender?.[0] || ""}`,
      adm.admNo || "",
      p.patientObj?.cardNo || "—",
      adm.roomType || "",
      adm.doa ? new Date(adm.doa).toLocaleString("en-IN") : "",
      adm.dod ? new Date(adm.dod).toLocaleString("en-IN") : "",
      calcStay(adm.doa, adm.dod),
      adm.type || "IPD",
      adm.typeRef || "—",
      adm.consultingDoctor || "",
      p.patientObj?.phone || "",
      p.patientObj?.address || "",
      adm.discharge?.status || "Active",
      adm.billing?.status || "Pending",
    ]);
    row.height = 24;
    row.eachCell((cell, colNum) => {
      cell.border    = { top: s(), bottom: s(), left: s(), right: s() };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.font      = { size: 9, name: "Arial" };
      if (colNum === 15) {
        const ok = ["Recovered","Discharged"].includes(cell.value);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ok ? "FFE6F4EA" : "FFFFF3CD" } };
        cell.font = { bold: true, color: { argb: ok ? "FF1E7E34" : "FF856404" }, size: 9, name: "Arial" };
      } else if (colNum === 16) {
        const ok = cell.value === "Generated";
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ok ? "FFFFF3CD" : "FFFDE8E8" } };
        cell.font = { bold: true, color: { argb: ok ? "FF856404" : "FFC0392B" }, size: 9, name: "Arial" };
      } else {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      }
      if (colNum === 2 || colNum === 14) cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    });
  });

  [6,18,13,14,10,14,18,18,8,6,8,18,13,22,16,12].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  ws.views = [{ state: "frozen", ySplit: 2 }];

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${locName}_IPD_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function s(style = "thin") { return { style, color: { argb: "FFBFCFDE" } }; }
function calcStay(doa, dod) {
  if (!doa) return "—";
  const days = Math.round((new Date(dod || Date.now()) - new Date(doa)) / 86400000);
  return `${days} Day${days !== 1 ? "s" : ""}`;
}
