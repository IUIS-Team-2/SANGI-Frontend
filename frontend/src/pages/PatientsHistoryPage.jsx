import * as XLSX from "xlsx";
import { useState, useEffect } from "react";
import { T, LOCATIONS } from "../data/constants";
import { fmtDT, fmtDate } from "../utils/helpers";
import { Ico, IC } from "../components/ui/Icons";
import { statusBadge } from "../components/ui/SharedUI";
import { apiService } from '../services/apiService';
import { downloadAdmissionNote } from './MedicalHistoryPage';

export default function PatientsHistoryPage({db, locId, onBack, onDischarge, onGenerateBill, onSetExpectedDod, onViewPatient, onSaveMedHistory, onFillMedHistory}){
  const loc = LOCATIONS.find(l => l.id === locId);
  const [filterDate, setFilterDate] = useState(""); const [filterMonth, setFilterMonth] = useState(""); const [filterYear, setFilterYear] = useState("");
  const [expDodModal, setExpDodModal] = useState(null);
  const [medHistModal, setMedHistModal] = useState(null);
  const [fillMedModal, setFillMedModal] = useState(null);
  const [fillMedData, setFillMedData] = useState({ previousDiagnosis: "", pastSurgeries: "", currentMedications: "", treatingDoctor: "", knownAllergies: "", chronicConditions: "", familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "" });

  // 🌟 NEW: State to hold our live Django data
  const [livePatients, setLivePatients] = useState(db || []);

  // 🌟 NEW: Fetching real data when the component loads
  useEffect(() => {
    const fetchRealData = async () => {
        try {
            const data = await apiService.getPatients();
            console.log("Fetched patients from Django:", data);
            // Replace the fake db data with the real Django data
            setLivePatients(data);
        } catch (error) {
            console.error("Failed to load real patient records:", error);
        }
    };
    fetchRealData();
  }, []);

  // 🌟 NEW: Changed 'db.flatMap' to 'livePatients.flatMap'
  const allRows = livePatients.flatMap(p => p.admissions?.map(adm => ({ patientName: p.patientName, uhid: p.uhid, admNo: adm.admNo, doa: adm.discharge?.doa || adm.dateTime || "", dod: adm.discharge?.dod || "", status: adm.discharge?.dischargeStatus || "", billing: adm.billing || {}, patientObj: p, admObj: adm })) || []).sort((a, b) => new Date(b.doa) - new Date(a.doa));
  
  const years = [...new Set(allRows.map(r => r.doa ? new Date(r.doa).getFullYear() : "").filter(Boolean))].sort((a, b) => b - a);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const filtered = allRows.filter(r => {
    if (!r.doa) return true;
    const d = new Date(r.doa);
    if (filterDate) { const fd = new Date(filterDate); if (d.toDateString() !== fd.toDateString()) return false; }
    if (filterMonth && String(d.getMonth()) !== filterMonth) return false;
    if (filterYear && String(d.getFullYear()) !== filterYear) return false;
    return true;
  });

  const totalAdm = filtered.length; const discharged = filtered.filter(r => r.dod && r.status).length; const pending = totalAdm - discharged; const billed = filtered.filter(r => r.billing && (r.billing.paidNow || r.billing.paymentMode)).length;
  const clearFilters = () => { setFilterDate(""); setFilterMonth(""); setFilterYear(""); };

  const downloadExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const { saveAs } = await import("file-saver");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("IPD Records");
    const locName = loc?.name || "Hospital";

    // Title row
    ws.mergeCells("A1:P1");
    const title = ws.getCell("A1");
    title.value = `🏥  ${locName} — IPD RECORDS  |  ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`;
    title.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 14, name: "Arial" };
    title.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D2B55" } };
    title.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 32;

    // Header row
    const headers = ["SR.NO","PATIENT NAME","AGE/G","IPD NO","CARD NO","ROOM","DOA & TIME","DOD & TIME","STAY","TYPE","TYPE REF/EMERGENCY","CONSULTANT NAME","NUMBER","ADDRESS","DISCHARGE STATUS","BILL STATUS"];
    const headerRow = ws.addRow(headers);
    headerRow.height = 36;
    const bs = (style="thin") => ({ style, color: { argb: "FFBFCFDE" } });
    headerRow.eachCell(cell => {
      cell.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 9, name: "Arial" };
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A3C6E" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border    = { top: bs("medium"), bottom: bs("medium"), left: bs("medium"), right: bs("medium") };
    });

    // Data rows
    const ROW_COLORS = ["FFD6E4F7", "FFFFF8E7"];
    filtered.forEach((r, i) => {
      const bg = ROW_COLORS[i % 2];
      const row = ws.addRow([
        i + 1,
        r.patientName,
        (r.patientObj?.ageYY ? r.patientObj.ageYY + " Yrs" : "") + (r.patientObj?.gender ? " / " + r.patientObj.gender.charAt(0).toUpperCase() : ""),
        "SH/" + (r.patientObj?.tpa ? r.patientObj.tpa.substring(0,4).toUpperCase() : "GEN") + "/26/" + (1900 + r.admNo),
        r.patientObj?.tpaCard || r.patientObj?.tpaPanelCardNo || "—",
        r.admObj?.discharge?.wardName || "—",
        r.doa ? fmtDT(r.doa) : "",
        r.dod ? fmtDT(r.dod) : "",
        r.doa && r.dod ? Math.ceil((new Date(r.dod) - new Date(r.doa)) / (1000*60*60*24)) + " Days" : "—",
        r.admObj?.admissionType || "IPD",
        r.admObj?.discharge?.admissionType || "—",
        r.admObj?.discharge?.doctorName || "—",
        r.patientObj?.phone || "—",
        r.patientObj?.address || "—",
        r.status || "Pending",
        (r.billing && (r.billing.paidNow || r.billing.paymentMode)) ? "Generated" : "Pending",
      ]);
      row.height = 24;
      row.eachCell((cell, colNum) => {
        cell.border    = { top: bs(), bottom: bs(), left: bs(), right: bs() };
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

    // Column widths & freeze
    [6,18,13,14,10,14,18,18,8,6,12,18,13,22,16,12].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
    ws.views = [{ state: "frozen", ySplit: 2 }];

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${locName}_IPD_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`);
  };
  const hasFilter = filterDate || filterMonth || filterYear;

  return (
    <div className="hist-page">
      <div className="hist-page-hd"><div><div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}><button className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding: "6px 14px", fontSize: 13 }}><Ico d={IC.dn} size={13} sw={2.5} style={{ transform: "rotate(90deg)" }} /> ← Back</button></div><h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, color: T.primary, marginBottom: 4 }}>Patients History</h1><p style={{ fontSize: 14, color: T.textMuted }}>{loc?.name} Branch · All admissions record</p></div><div style={{ marginLeft: "auto" }}><button onClick={downloadExcel} style={{ backgroundColor: T.primary, color: "#fff", padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>⬇ Download Excel</button></div></div>

      <div className="hist-filter-bar">
        <span className="hist-filter-label"><Ico d={IC.calendar} size={13} sw={2} /> Filter by</span><div className="hist-filter-sep" />
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><span style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: ".06em" }}>Date</span><input type="date" className="hist-filter-ctrl" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: 150 }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><span style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: ".06em" }}>Month</span><select className="hist-filter-ctrl" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ width: 140 }}><option value="">All Months</option>{months.map((m, i) => <option key={i} value={String(i)}>{m}</option>)}</select></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}><span style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: ".06em" }}>Year</span><select className="hist-filter-ctrl" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ width: 110 }}><option value="">All Years</option>{years.map(y => <option key={y} value={String(y)}>{y}</option>)}</select></div>
        {hasFilter && <button className="hist-clear-btn" onClick={clearFilters}>✕ Clear</button>}
        <span style={{ marginLeft: "auto", fontSize: 13, color: T.textMuted, fontWeight: 500 }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""} found</span>
      </div>

      <div className="hist-summary-stats">{[{ l: "Total Admissions", v: totalAdm, c: T.primary }, { l: "Discharged", v: discharged, c: T.green }, { l: "Pending Discharge", v: pending, c: T.amber }, { l: "Bills Generated", v: billed, c: T.accentDeep }].map(s => (<div key={s.l} className="hist-stat"><span className="hist-stat-num" style={{ color: s.c }}>{s.v}</span><span className="hist-stat-lbl">{s.l}</span></div>))}</div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: T.textMuted, fontSize: 14, background: T.white, borderRadius: 16, border: `1px solid ${T.border}` }}>
          <Ico d={IC.search} size={32} sw={1.5} /><br /><br />
          No admissions found{hasFilter ? " for the selected filter." : "."}
          {hasFilter && <><br /><button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={clearFilters}>Clear Filters</button></>}
        </div>
      ) : (
        <div className="hist-table-wrap">
          <table className="hist-table">
            <thead>
              <tr><th>#</th><th>Patient</th><th>Date of Admission</th><th>Expected Discharge</th><th>Medical History</th><th>Discharge Status</th><th>Bill</th></tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const isDischarge = r.dod && r.status;
                const hasBill = r.billing && (r.billing.paidNow || r.billing.paymentMode);
                const expDod = r.admObj.discharge?.expectedDod;

                return (<tr key={i} onClick={() => onViewPatient(r.patientObj)}>
                  <td style={{ color: T.textMuted, fontSize: 12, width: 40 }}>{i + 1}</td>
                  <td>
                    <div className="hist-pt-name">{r.patientName}</div>
                    <div className="hist-pt-uhid">{r.uhid} · Adm #{r.admNo}</div>
                  </td>
                  <td style={{ fontSize: 13, color: T.textMid, whiteSpace: "nowrap" }}>{fmtDT(r.doa)}</td>

                  {/* Expected Discharge Column */}
                  <td>
                    {expDod ? (
                      <div className="hist-dod-val" style={{ color: T.textMid }}><Ico d={IC.calendar} size={11} sw={2.5} /> {fmtDate(expDod)}</div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ padding: "5px 10px", fontSize: 12 }} onClick={(e) => { e.stopPropagation(); setExpDodModal({ p: r.patientObj, a: r.admObj, date: '' }); }}>Set Date</button>
                    )}
                  </td>

                  {/* Medical History Column */}
                  <td onClick={e => e.stopPropagation()}>
                    {r.admObj.medicalHistory && (r.admObj.medicalHistory.previousDiagnosis || r.admObj.medicalHistory.currentMedications || r.admObj.medicalHistory.knownAllergies) ? (
                      <button onClick={e => { e.stopPropagation(); setMedHistModal(r.admObj.medicalHistory); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 20, background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0", cursor: "pointer" }}>
                        ✓ View History
                      </button>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); onFillMedHistory(r.patientObj, r.admObj); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 20, background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", cursor: "pointer" }}>
                        ⚠ Not Filled — Click to Fill
                      </button>
                    )}
                  </td>
                  {/* Discharge Status Column */}
                  <td>
                    {isDischarge ? (
                      <div>
                        {statusBadge(r.status)}
                        <div className="hist-dod-val" style={{ marginTop: 4, fontSize: 11.5, color: T.textMid }}><Ico d={IC.check} size={10} sw={2.5} /> {fmtDT(r.dod)}</div>
                      </div>
                    ) : (
                      <button className="hist-discharge-btn" onClick={(e) => { e.stopPropagation(); onDischarge(r.patientObj, r.admObj); }}><Ico d={IC.bed} size={13} sw={2} /> Discharge</button>
                    )}
                  </td>

                  {/* Bill Column */}
                  <td>
                    {hasBill ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: T.greenTint, color: T.green, border: `1px solid ${T.greenBorder}` }}>
                        <Ico d={IC.check} size={10} sw={2.5} /> Generated
                      </span>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ borderColor: T.accentDeep, color: T.accentDeep, padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }} onClick={(e) => { e.stopPropagation(); onGenerateBill(r.patientObj, r.admObj); }}>
                        <Ico d={IC.receipt} size={12} sw={2} /> Generate Bill
                      </button>
                    )}
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Fill Medical History Modal */}
      {fillMedModal && (
        <div className="pdm-overlay" onClick={e => { if (e.target === e.currentTarget) setFillMedModal(null); }}>
          <div className="pdm-modal" style={{ maxWidth: 640 }}>
            <div className="pdm-hd" style={{ padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="pdm-hd-name" style={{ fontSize: 17 }}>Fill Medical History</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{fillMedModal.patientObj.patientName} · {fillMedModal.patientObj.uhid}</div>
              </div>
              <button className="pdm-close" onClick={() => setFillMedModal(null)}><Ico d={IC.x} size={15} sw={2} /></button>
            </div>
            <div style={{ padding: "22px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxHeight: "65vh", overflowY: "auto" }}>
              {[
                ["Previous Diagnosis", "previousDiagnosis", "e.g. Diabetes, Hypertension...", "textarea"],
                ["Past Surgeries", "pastSurgeries", "e.g. Appendectomy 2018...", "textarea"],
                ["Chronic Conditions", "chronicConditions", "e.g. Asthma, Heart disease...", "textarea"],
                ["Family History", "familyHistory", "e.g. Father - Diabetes...", "textarea"],
                ["Current Medications", "currentMedications", "e.g. Metformin 500mg...", "textarea"],
                ["Known Allergies", "knownAllergies", "e.g. Penicillin, Sulfa drugs...", "textarea"],
                ["Previous Treating Doctor", "treatingDoctor", "Dr. Name & Speciality", "input"],
                ["Smoking Status", "smokingStatus", "", "select-smoke"],
                ["Alcohol Use", "alcoholUse", "", "select-alcohol"],
                ["Additional Notes", "notes", "Any other relevant history...", "textarea"],
              ].map(([lbl, key, ph, type]) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 10.5, fontWeight: 700, color: "#4A7FA5", textTransform: "uppercase", letterSpacing: ".06em" }}>{lbl}</label>
                  {type === "textarea" ? (
                    <textarea rows={2} placeholder={ph} value={fillMedData[key]} onChange={e => setFillMedData(p => ({ ...p, [key]: e.target.value }))}
                      style={{ fontFamily: "DM Sans,sans-serif", fontSize: 13, color: "#0B2040", background: "#fff", border: "1.5px solid #BFDBEE", borderRadius: 8, padding: "9px 12px", width: "100%", outline: "none", resize: "vertical" }} />
                  ) : type === "select-smoke" ? (
                    <select value={fillMedData[key]} onChange={e => setFillMedData(p => ({ ...p, [key]: e.target.value }))}
                      style={{ fontFamily: "DM Sans,sans-serif", fontSize: 13, color: "#0B2040", background: "#fff", border: "1.5px solid #BFDBEE", borderRadius: 8, padding: "9px 12px", width: "100%", outline: "none", appearance: "none" }}>
                      <option value="">Select...</option>
                      <option>Non-smoker</option><option>Ex-smoker</option><option>Current smoker</option>
                    </select>
                  ) : type === "select-alcohol" ? (
                    <select value={fillMedData[key]} onChange={e => setFillMedData(p => ({ ...p, [key]: e.target.value }))}
                      style={{ fontFamily: "DM Sans,sans-serif", fontSize: 13, color: "#0B2040", background: "#fff", border: "1.5px solid #BFDBEE", borderRadius: 8, padding: "9px 12px", width: "100%", outline: "none", appearance: "none" }}>
                      <option value="">Select...</option>
                      <option>None</option><option>Occasional</option><option>Regular</option>
                    </select>
                  ) : (
                    <input placeholder={ph} value={fillMedData[key]} onChange={e => setFillMedData(p => ({ ...p, [key]: e.target.value }))}
                      style={{ fontFamily: "DM Sans,sans-serif", fontSize: 13, color: "#0B2040", background: "#fff", border: "1.5px solid #BFDBEE", borderRadius: 8, padding: "9px 12px", width: "100%", outline: "none" }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #BFDBEE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="btn btn-ghost" onClick={() => setFillMedModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                onSaveMedHistory(fillMedModal.patientObj.uhid, fillMedModal.admObj.admNo, fillMedData);
                setFillMedModal(null);
                setFillMedData({ previousDiagnosis: "", pastSurgeries: "", currentMedications: "", treatingDoctor: "", knownAllergies: "", chronicConditions: "", familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "" });
              }}>Save Medical History</button>
            </div>
          </div>
        </div>
      )}
      {/* Medical History View Modal */}
      {medHistModal && (
        <div className="pdm-overlay" onClick={e => { if (e.target === e.currentTarget) setMedHistModal(null); }}>
          <div className="pdm-modal" style={{ maxWidth: 560 }}>
            <div className="pdm-hd" style={{ padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="pdm-hd-name" style={{ fontSize: 17 }}>Medical History</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>Past diagnoses, medications and allergies</div>
              </div>
              <button className="pdm-close" onClick={() => setMedHistModal(null)}><Ico d={IC.x} size={15} sw={2} /></button>
            </div>
            <div style={{ padding: "22px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[["Previous Diagnosis", medHistModal.previousDiagnosis], ["Past Surgeries", medHistModal.pastSurgeries], ["Chronic Conditions", medHistModal.chronicConditions], ["Family History", medHistModal.familyHistory], ["Current Medications", medHistModal.currentMedications], ["Known Allergies", medHistModal.knownAllergies], ["Treating Doctor", medHistModal.treatingDoctor], ["Smoking Status", medHistModal.smokingStatus], ["Alcohol Use", medHistModal.alcoholUse], ["Notes", medHistModal.notes]].map(([lbl, val]) => (
                <div key={lbl} style={{ background: "#F0F9FF", border: "1px solid #BFDBEE", borderRadius: 10, padding: "11px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#88B4CC", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>{lbl}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: val ? "#0B2040" : "#88B4CC" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #BFDBEE", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => downloadAdmissionNote(medHistModal, null, null, locId)} style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #4A7FA5", background: "#F0F9FF", color: "#4A7FA5", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>🖨 Download Admission Note</button>
              <button className="btn btn-ghost" onClick={() => setMedHistModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Expected Discharge Modal Popup */}
      {expDodModal && (
        <div className="pdm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setExpDodModal(null); }}>
          <div className="pdm-modal" style={{ maxWidth: 400 }}>
            <div className="pdm-hd" style={{ padding: "14px 20px" }}>
              <div className="pdm-hd-name" style={{ fontSize: 16 }}>Set Expected Discharge</div>
              <button className="pdm-close" style={{ width: 28, height: 28 }} onClick={() => setExpDodModal(null)}><Ico d={IC.x} size={14} sw={2} /></button>
            </div>
            <div className="pdm-body" style={{ padding: "20px" }}>
              <p style={{ marginBottom: 16, fontSize: 13.5, color: T.textMuted }}>
                Set the expected discharge date for <strong style={{ color: T.primary }}>{expDodModal.p.patientName}</strong> (Adm #{expDodModal.a.admNo}).
              </p>
              <div className="fld" style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 7, display: "block" }}>Expected Date</label>
                <input type="date" className="ctrl" value={expDodModal.date} onChange={e => setExpDodModal({ ...expDodModal, date: e.target.value })} />
              </div>
              <div className="btn-row">
                <button className="btn btn-ghost" onClick={() => setExpDodModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => { onSetExpectedDod(expDodModal.p.uhid, expDodModal.a.admNo, expDodModal.date); setExpDodModal(null); }}>Save Date</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}