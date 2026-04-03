import { toast } from "../components/ui/Toast";
import { T, LOCATIONS } from "../data/constants";
import { fmtDT } from "../utils/helpers";
import { Ico, IC } from "../components/ui/Icons";
import { Card } from "../components/ui/SharedUI";

export default function SummaryPage({uhid,patient,discharge,svcs,billing,locId,admNo,onPrint,onRequestPrint}){
  const total=svcs.reduce((a,s)=>a+(parseFloat(s.rate)||0)*(parseInt(s.qty)||0),0);
  const disc=parseFloat(billing.discount)||0;const adv=parseFloat(billing.advance)||0;const paid=parseFloat(billing.paidNow)||0;const net=Math.max(0,total-disc-adv-paid);
  const today=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  const loc=LOCATIONS.find(l=>l.id===locId);

  const handleRequestPrint = () => {
    if (onRequestPrint) {
      onRequestPrint({ uhid, patient, discharge, svcs, billing, locId, admNo });
      toast.success("Print request sent to Super Admin for approval!");
    }
  };

  return(<div className="form-page">
    <div className="page-hd-row"><div><h1 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:T.primary,marginBottom:5}}>Final Summary</h1><p style={{fontSize:14,color:T.textMuted}}>Review and generate the invoice for Admission #{admNo}</p></div></div>
    <Card icon={IC.person} title="Patient Information" delay={0}><div className="g2">{[["UHID",uhid],["Admission #",`#${admNo}`],["Patient Name",patient.patientName],["Guardian",patient.guardianName],["Gender",patient.gender],["Blood Group",patient.bloodGroup],["Phone",patient.phone],["National ID",patient.nationalId],["Branch",`${loc.name}, Mathura`],["Address",patient.address]].map(([l,v])=>(<div key={l}><div style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>{l}</div><div style={{fontSize:14,fontWeight:500,color:T.text}}>{v||"—"}</div></div>))}</div></Card>
    <Card icon={IC.bed} title="Discharge Details" delay={0.04}><div className="g2">{[["Status",discharge.dischargeStatus],["Department",discharge.department],["Doctor",discharge.doctorName],["Ward",discharge.wardName],["Room/Bed",`${discharge.roomNo||"—"} / ${discharge.bedNo||"—"}`],["Admission",fmtDT(discharge.doa)],["Discharge",fmtDT(discharge.dod)],["Diagnosis",discharge.diagnosis]].map(([l,v])=>(<div key={l}><div style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>{l}</div><div style={{fontSize:14,fontWeight:500,color:T.text}}>{v||"—"}</div></div>))}</div></Card>
    <div className="inv-card">
      <div className="inv-hd"><div className="inv-hd-ico"><Ico d={IC.receipt} size={17} sw={1.75}/></div><div><p className="inv-hd-ttl">Invoice — Admission #{admNo}</p><p className="inv-hd-sub">{svcs.length} service{svcs.length!==1?"s":""} · {today} · {loc.name}</p></div></div>
      <div className="inv-rows">{svcs.filter(s=>s.title||s.type).map((s,i)=>(<div className="inv-row" key={i}><span className="inv-lbl">{s.title||s.type} {s.code?`(${s.code})`:""}</span><span className="inv-val">₹{((parseFloat(s.rate)||0)*(parseInt(s.qty)||0)).toFixed(2)}</span></div>))}<div className="inv-row"><span className="inv-lbl" style={{fontWeight:600}}>Gross Total</span><span className="inv-val">₹{total.toFixed(2)}</span></div><div className="inv-row"><span className="inv-lbl">Discount</span><span className="inv-val">− ₹{disc.toFixed(2)}</span></div><div className="inv-row"><span className="inv-lbl">Advance Payment</span><span className="inv-val">− ₹{adv.toFixed(2)}</span></div><div className="inv-row"><span className="inv-lbl">Amount Paid Now</span><span className="inv-val">− ₹{paid.toFixed(2)}</span></div></div>
      <div className="inv-net"><span className="net-lbl">Net Payable Amount</span><span className="net-val">₹{net.toFixed(2)}</span></div>
    </div>
    {billing.paymentMode&&<div className="pay-pill"><Ico d={IC.wallet} size={13} sw={2}/> Payment via: <strong>{billing.paymentMode}</strong></div>}

    {/* Request Print Button */}
    <div className="btn-row">
      <button className="btn btn-print" onClick={handleRequestPrint}>
        <Ico d={IC.print} size={15} sw={2}/> Request Invoice Print
      </button>
    </div>
    <div style={{textAlign:"center",fontSize:12,color:T.textMuted,marginTop:8}}>
      🔒 Print requires Super Admin approval
    </div>
  </div>);
}
