import { useState } from "react";
import { T, GENDERS, MARITAL, BLOOD_GRP, TPA_LIST, TPA_CARD_TYPES } from "../data/constants";
import { Ico, IC } from "../components/ui/Icons";
import { Card, Inp, Sel, Txta, Field } from "../components/ui/SharedUI";
import { apiService } from '../services/apiService';

export default function PatientFormPage({data, setData, onSubmit, errs, onBack}) {
  const set = k => e => setData(p => ({ ...p, [k]: e.target.value }));
  const setVal = k => v => setData(p => ({ ...p, [k]: v }));
  
  const handleDob = e => {
    const dob = e.target.value;
    if (!dob) { setData(p => ({ ...p, dob: "", ageYY: "", ageMM: "", ageDD: "" })); return; }
    const today = new Date(); const birth = new Date(dob);
    let yy = today.getFullYear() - birth.getFullYear(); let mm = today.getMonth() - birth.getMonth(); let dd = today.getDate() - birth.getDate();
    if (dd < 0) { mm--; dd += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
    if (mm < 0) { yy--; mm += 12; }
    setData(p => ({ ...p, dob, ageYY: String(yy), ageMM: String(mm), ageDD: String(dd) }));
  };

  const payMode = data.payMode || "cash";
  const cashlessType = data.cashlessType || "";
// 🌟 UPDATED: Catching the real data and removing alerts
  const handleApiSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit();
  };

  return (
    <div className="form-page">
      <div className="page-hd"><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}><div><h1>New Patient Registration</h1><p>Fill in all details to register and generate a UHID</p></div><button className="btn btn-ghost btn-sm" onClick={onBack}>← Back to Search</button></div></div>
      <Card icon={IC.person} title="Personal Details" subtitle="Core identity and demographic information" delay={0}>
        <div className="g2">
          <Inp label="Patient Name" req placeholder="Full legal name" value={data.patientName} onChange={set("patientName")} err={errs?.patientName} />
          <Inp label="Guardian Name" req placeholder="Guardian / relative's name" value={data.guardianName} onChange={set("guardianName")} err={errs?.guardianName} />
          <Sel label="Gender" req opts={GENDERS} placeholder="Select gender" value={data.gender} onChange={set("gender")} err={errs?.gender} />
          <Sel label="Marital Status" opts={MARITAL} placeholder="Select status" value={data.maritalStatus} onChange={set("maritalStatus")} />
          <Sel label="Blood Group" opts={BLOOD_GRP} placeholder="Select blood group" value={data.bloodGroup} onChange={set("bloodGroup")} />
          <Inp label="Date of Birth" type="date" value={data.dob} onChange={handleDob} />
        </div>
        <div className="div-lbl mt">Age <span style={{ fontSize: 10, fontWeight: 400, color: T.textLight, textTransform: "none", letterSpacing: 0 }}>(auto-filled from DOB)</span></div>
        <div className="g3">
          <Inp label="Years" placeholder="YY" type="number" value={data.ageYY} onChange={set("ageYY")} />
          <Inp label="Months" placeholder="MM" type="number" value={data.ageMM} onChange={set("ageMM")} />
          <Inp label="Days" placeholder="DD" type="number" value={data.ageDD} onChange={set("ageDD")} />
        </div>
      </Card>
      <Card icon={IC.phone} title="Contact Information" subtitle="Phone, email and address" delay={0.04}>
        <div className="g2">
          <Inp label="Phone Number" req type="tel" placeholder="10-digit mobile" value={data.phone} onChange={set("phone")} err={errs?.phone} />
          <Inp label="Alternate Number" type="tel" placeholder="10-digit alternate" value={data.altPhone} onChange={set("altPhone")} />
          <Inp label="Email Address" req type="email" placeholder="patient@email.com" value={data.email} onChange={set("email")} err={errs?.email} />
          <Inp label="National ID" req placeholder="Aadhar / PAN / Passport" value={data.nationalId} onChange={set("nationalId")} err={errs?.nationalId} />
          <div className="s2"><Field label="Residential Address" req err={errs?.address}><textarea className={`ctrl${errs?.address ? " err" : ""}`} rows={2} placeholder="Full address with city, state and PIN code" value={data.address} onChange={set("address")} /></Field></div>
        </div>
      </Card>
      <Card icon={IC.file} title="Remarks & Allergies" subtitle="Additional notes for treating team" delay={0.08}>
        <div className="g2">
          <Txta label="Remarks / Notes" placeholder="Any additional notes…" value={data.remarks} onChange={set("remarks")} rows={3} />
          <Txta label="Known Allergies" placeholder="Drug, food or other known allergies…" value={data.allergies} onChange={set("allergies")} rows={3} />
        </div>
      </Card>

      <Card icon={IC.shield} title="Payment Panel" subtitle="Select payment mode for this admission" delay={0.12}>
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button onClick={() => { setVal("payMode")("cash"); setData(p => ({ ...p, payMode: "cash", cashlessType: "", tpa: "", tpaCard: "", tpaValidity: "", tpaCardType: "", tpaPanelCardNo: "", tpaPanelValidity: "" })); }}
            style={{ flex: 1, padding: "14px 12px", borderRadius: 12, border: `2px solid ${payMode === "cash" ? T.green : T.border}`, background: payMode === "cash" ? T.greenTint : T.white, cursor: "pointer", transition: "all .15s" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>💵</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: payMode === "cash" ? T.green : T.text }}>Cash</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Direct payment</div>
          </button>
          <button onClick={() => setVal("payMode")("cashless")}
            style={{ flex: 1, padding: "14px 12px", borderRadius: 12, border: `2px solid ${payMode === "cashless" ? T.accentDeep : T.border}`, background: payMode === "cashless" ? T.bgTint : T.white, cursor: "pointer", transition: "all .15s" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>🏥</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: payMode === "cashless" ? T.accentDeep : T.text }}>Cashless</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Insurance / Panel card</div>
          </button>
        </div>

        {payMode === "cash" && (
          <div style={{ background: T.greenTint, border: `1px solid ${T.greenBorder}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: T.green }}>Cash Payment Selected</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>Patient will pay directly at discharge</div>
            </div>
          </div>
        )}

        {payMode === "cashless" && (<>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Select Cashless Type</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["TPA", "Panel Card"].map(type => (
                <button key={type} onClick={() => { setVal("cashlessType")(type); setData(p => ({ ...p, cashlessType: type, tpa: "", tpaCard: "", tpaValidity: "", tpaCardType: "", tpaPanelCardNo: "", tpaPanelValidity: "" })); }}
                  style={{ padding: "8px 20px", borderRadius: 8, border: `1.5px solid ${cashlessType === type ? T.accentDeep : T.border}`, background: cashlessType === type ? T.bgTint : T.white, color: cashlessType === type ? T.accentDeep : T.textMuted, fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all .15s" }}>
                  {type === "TPA" ? "🏦 TPA (Insurance)" : "🪪 Panel Card"}
                </button>
              ))}
            </div>
          </div>

          {cashlessType === "TPA" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, background: T.offwhite, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <Sel label="Insurance Company" opts={TPA_LIST} placeholder="Select insurance company" value={data.tpa} onChange={set("tpa")} />
              <div className="g2">
                <Inp label="TPA Card No." placeholder="TPA card number" value={data.tpaCard} onChange={set("tpaCard")} />
                <Inp label="Validity Date" type="date" value={data.tpaValidity} onChange={set("tpaValidity")} />
              </div>
            </div>
          )}

          {cashlessType === "Panel Card" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16, background: T.offwhite, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <Sel label="Card Type" opts={TPA_CARD_TYPES} placeholder="Select card type" value={data.tpaCardType} onChange={set("tpaCardType")} />
              <div className="g2">
                <Inp label="Card No." placeholder="Panel card number" value={data.tpaPanelCardNo} onChange={set("tpaPanelCardNo")} />
                <Inp label="Validity Date" type="date" value={data.tpaPanelValidity} onChange={set("tpaPanelValidity")} />
              </div>
            </div>
          )}

          {!cashlessType && (
            <div style={{ background: T.bgTint, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: T.textMuted }}>
              👆 Select TPA or Panel Card above to fill details
            </div>
          )}
        </>)}
      </Card>

      {/* 🌟 NEW: Attached handleApiSubmit here instead of onSubmit */}
      <div className="btn-row"><button className="btn btn-accent" onClick={handleApiSubmit}><Ico d={IC.check} size={15} sw={2.5} /> Register &amp; Generate UHID</button></div>
    </div>);
}