import { useState } from "react";
import { T, NAV_PAGES } from "./data/constants";
import { LOCATION_DB } from "./data/mockDb";
import { blankPatient, blankDischarge, blankBilling, blankSvc } from "./utils/helpers";
import { Ico, IC, PAGE_ICONS } from "./components/ui/Icons";

// Core Components
import LiveDate from "./components/layout/LiveDate";

// Pages
import SearchPage from "./pages/SearchPage";
import PatientFormPage from "./pages/PatientFormPage";
import DischargePage from "./pages/DischargePage";
import ServicesPage from "./pages/ServicesPage";
import SummaryPage from "./pages/SummaryPage";
import PatientsHistoryPage from "./pages/PatientsHistoryPage";
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import MedicalHistoryPage from "./pages/MedicalHistoryPage";
import LoginPage from "./pages/LoginPage";

// Modals
import UHIDScreen from "./modals/UHIDScreen";
import PrintModal from "./modals/PrintModal";
import PatientDetailModal from "./modals/PatientDetailModal";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [locId, setLocId] = useState("laxmi");
  const [page, setPage] = useState("patient");
  const [subPage, setSubPage] = useState("search");
  const [uhid, setUhid] = useState(null);
  const [admNo, setAdmNo] = useState(1);
  const [showUHID, setShowUHID] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [patientDone, setPatientDone] = useState(false);
  const [dischargeDone, setDischargeDone] = useState(false);
  const [servicesDone, setServicesDone] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showPatientDetail, setShowPatientDetail] = useState(null);
  const [printRequests, setPrintRequests] = useState([]);

  const [patient, setPatient] = useState(blankPatient());
  const [medicalHistory, setMedicalHistory] = useState({ previousDiagnosis: "", pastSurgeries: "", currentMedications: "", treatingDoctor: "", knownAllergies: "", chronicConditions: "", familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "" });
  const [medicalDone, setMedicalDone] = useState(false);
  const [discharge, setDischarge] = useState(blankDischarge());
  const [svcs, setSvcs] = useState([blankSvc()]);
  const [billing, setBilling] = useState(blankBilling());
  const [errs, setErrs] = useState({});

  const [db, setDb] = useState(JSON.parse(JSON.stringify(LOCATION_DB)));

  const currentDb = db[locId];

  const resetAll = () => {
    setPage("patient");
    setSubPage("search");
    setUhid(null);
    setShowUHID(false);
    setPatientDone(false);
    setMedicalDone(false);
    setDischargeDone(false);
    setServicesDone(false);
    setPatient(blankPatient());
    setDischarge(blankDischarge());
    setSvcs([]);
    setBilling(blankBilling());
    setErrs({});
    setMedicalHistory({ previousDiagnosis: "", pastSurgeries: "", currentMedications: "", treatingDoctor: "", knownAllergies: "", chronicConditions: "", familyHistory: "", smokingStatus: "", alcoholUse: "", notes: "" });
  };

  const switchLoc = id => { setLocId(id); resetAll(); setShowPatientDetail(null); };

  const handleLogin = (user, loc) => {
    setCurrentUser(user);
    setLocId(loc || "laxmi");
    setLoggedIn(true);
    if (user.role === "superadmin") {
      setPage("superadmin");
    } else {
      setPage("patient");
      setSubPage("search");
    }
  };

  const endSession = () => { resetAll(); };

  const syncDb = (currentUhid, currentAdmNo, dataKey, dataValue) => {
    setDb(prev => {
      const nextDb = JSON.parse(JSON.stringify(prev));
      const p = nextDb[locId].find(x => x.uhid === currentUhid);
      if (p) {
        const a = p.admissions.find(x => x.admNo === currentAdmNo);
        if (a) a[dataKey] = dataValue;
      }
      return nextDb;
    });
  };

  const handleNewAdmission = existing => {
    const { admissions, ...pd } = existing; setPatient(pd); setUhid(existing.uhid);
    const newAdmNo = existing.admissions.length + 1; setAdmNo(newAdmNo); setIsReturning(true); setShowUHID(true);
    setDb(prev => {
      const nextDb = JSON.parse(JSON.stringify(prev));
      const p = nextDb[locId].find(x => x.uhid === existing.uhid);
      p.admissions.push({ admNo: newAdmNo, dateTime: new Date().toISOString(), discharge: blankDischarge(), services: [], billing: blankBilling() });
      return nextDb;
    });
  };

  const handleDischargeFromHistory = (patientObj, admObj) => {
    const { admissions, ...pd } = patientObj; setPatient(pd); setUhid(patientObj.uhid); setAdmNo(admObj.admNo); setIsReturning(true);
    setDischarge({ ...blankDischarge(), ...(admObj.discharge || {}) }); setSvcs(admObj.services && admObj.services.length ? admObj.services : []); setBilling({ ...blankBilling(), ...(admObj.billing || {}) });
    setPatientDone(true); setDischargeDone(false); setServicesDone(false); setShowPatientDetail(null); setShowUHID(false); setPage("discharge");
  };

  const handleGenerateBillFromHistory = (patientObj, admObj) => {
    const { admissions, ...pd } = patientObj; setPatient(pd); setUhid(patientObj.uhid); setAdmNo(admObj.admNo); setIsReturning(true);
    setDischarge({ ...blankDischarge(), ...(admObj.discharge || {}) }); setSvcs(admObj.services && admObj.services.length ? admObj.services : []); setBilling({ ...blankBilling(), ...(admObj.billing || {}) });
    setPatientDone(true); setDischargeDone(true); setServicesDone(false); setShowPatientDetail(null); setShowUHID(false); setPage("services");
  };

  const handleSetExpectedDod = (uhidToUpdate, admNoToUpdate, date) => {
    setDb(prev => {
      const nextDb = JSON.parse(JSON.stringify(prev));
      nextDb[locId].forEach(p => { if (p.uhid === uhidToUpdate) p.admissions.forEach(a => { if (a.admNo === admNoToUpdate) { if (!a.discharge) a.discharge = {}; a.discharge.expectedDod = date; } }); });
      return nextDb;
    });
  };

  const validatePatient = () => {
    const e = {}; if (!patient.patientName.trim()) e.patientName = "Required"; if (!patient.guardianName.trim()) e.guardianName = "Required"; if (!patient.gender) e.gender = "Required"; if (!patient.phone || patient.phone.replace(/\D/g, "").length !== 10) e.phone = "Must be 10 digits"; if (!patient.email || !patient.email.includes("@")) e.email = "Valid email required"; if (!patient.nationalId.trim()) e.nationalId = "Required"; if (!patient.address.trim()) e.address = "Required"; setErrs(e); return !Object.keys(e).length;
  };

  const handleRegister = () => {
    if (!validatePatient()) return;
    const newUhid = "UHID-" + Math.floor(1000000 + Math.random() * 9000000);
    setUhid(newUhid); setAdmNo(1); setIsReturning(false); setShowUHID(true);
    const newPat = { ...patient, uhid: newUhid, admissions: [{ admNo: 1, dateTime: new Date().toISOString(), discharge: blankDischarge(), services: [], billing: blankBilling() }] };
    setDb(prev => ({ ...prev, [locId]: [newPat, ...prev[locId]] }));
  };

  const handleUHIDContinue   = () => { setPatientDone(true); setShowUHID(false); setPage("medical"); };
  const handleUHIDDashboard  = () => { setPatientDone(true); setShowUHID(false); setPage("patient"); setSubPage("search"); };
  const handleUHIDNewPatient = () => { endSession(); setSubPage("form"); };

  const handleSaveMedical = () => { syncDb(uhid, admNo, "medicalHistory", medicalHistory); setMedicalDone(true); setPage("discharge"); };
  const handleSaveMedHistoryFromHistory = (uhidVal, admNoVal, data) => { setDb(prev => { const next = JSON.parse(JSON.stringify(prev)); const p = next[locId].find(x => x.uhid === uhidVal); if (p) { const a = p.admissions.find(x => x.admNo === admNoVal); if (a) a.medicalHistory = data; } return next; }); };
  const handleSaveDischarge  = () => { syncDb(uhid, admNo, 'discharge', discharge); setDischargeDone(true); setPage("services"); };
  const handleSaveServices   = (updatedSvcs, updatedBilling) => {
    setSvcs(updatedSvcs); setBilling(updatedBilling);
    syncDb(uhid, admNo, 'services', updatedSvcs); syncDb(uhid, admNo, 'billing', updatedBilling);
    setServicesDone(true); setPage("summary");
  };

  // Invoice print request: branch staff requests → super admin approves
  const handleRequestPrint = (req) => {
    setPrintRequests(prev => [...prev, { ...req, requestedAt: new Date().toISOString() }]);
  };

  const handleApprovePrint = (req, action) => {
    setPrintRequests(prev => prev.filter(r => !(r.uhid === req.uhid && r.admNo === req.admNo && r.locId === req.locId)));
    if (action === "approve") {
      setShowPrint(true);
      setUhid(req.uhid);
      setPatient(req.patient || patient);
      setDischarge(req.discharge || discharge);
      setSvcs(req.svcs || svcs);
      setBilling(req.billing || billing);
      setLocId(req.locId);
      setAdmNo(req.admNo);
    }
  };

  const canNav = id => ({ patient: true, medical: patientDone, discharge: patientDone && medicalDone, services: patientDone && medicalDone && dischargeDone, summary: patientDone && medicalDone && dischargeDone && servicesDone }[id] || false);
  const isDone = id => ({ patient: patientDone, medical: medicalDone, discharge: dischargeDone, services: servicesDone }[id] || false);
  const navTo  = id => { if (!canNav(id)) return; setShowUHID(false); setPage(id); };

  if (!loggedIn) return <LoginPage onLogin={handleLogin} />;

  // ── SUPER ADMIN: render FULLSCREEN, no header/sidebar ──
  if (page === "superadmin") {
    return (
      <>
        {showPrint && (
          <PrintModal uhid={uhid} patient={patient} discharge={discharge}
            svcs={svcs} billing={billing} locId={locId} admNo={admNo}
            onClose={() => setShowPrint(false)} />
        )}
        <SuperAdminDashboard
          db={db}
          printRequests={printRequests}
          onApprovePrint={handleApprovePrint}
          onLogout={() => { setLoggedIn(false); setCurrentUser(null); resetAll(); setPrintRequests([]); }}
        />
      </>
    );
  }

  // ── BRANCH STAFF: normal layout with header + sidebar ──
  return (
    <>
      {showPrint && (
        <PrintModal uhid={uhid} patient={patient} discharge={discharge}
          svcs={svcs} billing={billing} locId={locId} admNo={admNo}
          onClose={() => setShowPrint(false)} />
      )}
      {showPatientDetail && (
        <PatientDetailModal patient={showPatientDetail}
          onClose={() => setShowPatientDetail(null)}
          onDischarge={handleDischargeFromHistory} />
      )}

      <header className="hdr">
        <div className="hdr-left">
          <div className="hdr-logo">
            <img src="/logo192.png" alt="logo" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover" }} />
          </div>
          <div>
            <p className="hdr-name">Sangi Hospital</p>
            <p className="hdr-sub">IPD Portal</p>
          </div>
        </div>

        <div className="hdr-right">
          {uhid && <div className="hdr-uhid"><span className="hdr-uhid-label">UHID</span>{uhid}</div>}
          <LiveDate />
          {currentUser && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 12 }}>

              <div style={{ fontSize: 12, lineHeight: 1.4, textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "#fff" }}>{currentUser.name}</div>
                <div style={{ color: "rgba(255,255,255,.5)" }}>
                  {locId === "laxmi" ? "Laxmi Nagar Branch" : "Raya Branch"}
                </div>
              </div>
              <button
                onClick={() => { setLoggedIn(false); setCurrentUser(null); resetAll(); }}
                style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-top">
            <div className="sidebar-section-label">Registration Steps</div>
            {NAV_PAGES.map((p, i) => {
              const locked = !canNav(p.id); const active = page === p.id && !showUHID; const done = isDone(p.id);
              return (
                <div key={p.id} className={`nav-item${active ? " active" : ""}${done && !active ? " done" : ""}${locked ? " locked" : ""}`} onClick={() => navTo(p.id)}>
                  <div className="nav-icon">{locked ? <Ico d={IC.lock} size={15} sw={2} /> : <Ico d={PAGE_ICONS[p.icon]} size={15} sw={2} />}</div>
                  <span className="nav-label">{p.label}</span>
                  <span className="nav-step-num">
                    {p.id === "medical" && !medicalDone && patientDone
                      ? <span style={{ fontSize: 9, color: T.amber }}>!</span>
                      : done ? <Ico d={IC.check} size={10} sw={2.5} /> : i + 1}
                  </span>
                </div>
              );
            })}
            <div className="sidebar-divider" />
            <div className="sidebar-section-label" style={{ marginTop: 8 }}>Records</div>
            <div className={`sidebar-hist-item${page === "history" ? " active" : ""}`} onClick={() => { setShowUHID(false); setPage("history"); }}>
              <div className="sidebar-hist-icon"><Ico d={IC.users} size={15} sw={2} /></div>
              <span className="sidebar-hist-label">Patients History</span>
            </div>
          </div>
          {uhid && (
            <div className="sidebar-bottom">
              <div className="uhid-card" style={{ marginBottom: 12 }}>
                <div className="uhid-card-label">Current UHID</div>
                <div className="uhid-card-val">{uhid}</div>
                <div className="uhid-card-sub">{patient.patientName || "Patient"}{admNo > 1 ? ` · Adm #${admNo}` : ""}</div>
              </div>
              <button onClick={endSession} style={{ width: "100%", padding: "10px", borderRadius: "10px", background: T.redTint, color: T.red, border: `1px solid ${T.red}`, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Ico d={IC.cross} size={14} sw={2.5} /> Close Patient
              </button>
            </div>
          )}
        </aside>

        <main className="main" key={page + showUHID + subPage + locId}>
          {page === "patient"  && !showUHID && subPage === "search" && <SearchPage db={currentDb} locId={locId} onNewAdmission={handleNewAdmission} onNewPatient={() => setSubPage("form")} />}
          {page === "patient"  && !showUHID && subPage === "form"   && <PatientFormPage data={patient} setData={setPatient} onSubmit={handleRegister} errs={errs} onBack={() => setSubPage("search")} />}
          {page === "patient"  && showUHID  && <UHIDScreen uhid={uhid} patient={patient} isReturning={isReturning} admNo={admNo} onContinue={handleUHIDContinue} onDashboard={handleUHIDDashboard} onNewPatient={handleUHIDNewPatient} />}
          {page === "medical"  && <MedicalHistoryPage data={medicalHistory} setData={setMedicalHistory} onSave={handleSaveMedical} onSkip={handleSaveMedical} patient={patient} discharge={discharge} locId={locId} />}
          {page === "discharge"&& <DischargePage data={discharge} setData={setDischarge} onSave={handleSaveDischarge} />}
          {page === "services" && <ServicesPage svcs={svcs} setSvcs={setSvcs} billing={billing} setBilling={setBilling} onSave={handleSaveServices} />}
          {page === "summary"  && <SummaryPage uhid={uhid} patient={patient} discharge={discharge} svcs={svcs} billing={billing} locId={locId} admNo={admNo} onPrint={() => setShowPrint(true)} />}
          {page === "history"  && <PatientsHistoryPage db={currentDb} locId={locId} onBack={() => setPage("patient")} onDischarge={handleDischargeFromHistory} onGenerateBill={handleGenerateBillFromHistory} onSetExpectedDod={handleSetExpectedDod} onViewPatient={p => setShowPatientDetail(p)} onSaveMedHistory={handleSaveMedHistoryFromHistory} />}
        </main>
      </div>
    </>
  );
}
