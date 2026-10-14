'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3, FileText, HeartPulse, Layers3, LoaderCircle, MessageCircle, Search, ShieldCheck, Sparkles, Stethoscope, Users, X } from 'lucide-react';
import { buildBriefPrompt } from '@/lib/prompt';
import {buildDiagnosisLabels,diagnosisRecordTitle} from '@/lib/diagnosis-labels';
import {summarizeSource} from '@/lib/source-summary';
import {ReadableText} from './readable-text';
import {ThemeToggle} from './theme-toggle';
import { SourceDocument } from './source-document';
import { RequestCoordinator } from '@/lib/request-coordinator';
import { patientAtDate, todayInHelsinki } from '@/lib/record-context';
import type { Brief, Patient, PatientRecord, Role } from '@/lib/schema';
const roles: { id: Role; label: string }[] = [{ id: 'doctor', label: 'Doctor' }, { id: 'nurse', label: 'Nurse' }, { id: 'social-worker', label: 'Social worker' }];
const date = (value: string) => new Date(value + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export function Workspace({ patients, externalAllowed, total, allTotal, page, query }: { patients: Patient[]; externalAllowed: boolean; total: number; allTotal: number; page: number; query: string }) {
  const [patientId, setPatientId] = useState(patients[0].id);
  const patient = patients.find(p => p.id === patientId)!;
  const [role, setRole] = useState<Role>('doctor');
  const [reason, setReason] = useState(patient.visitReason);
  const [asOfDate, setAsOfDate] = useState(todayInHelsinki);
  const diagnoses=useMemo(()=>buildDiagnosisLabels(patient.records,asOfDate),[patient,asOfDate]);
  const [search, setSearch] = useState(query);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState<PatientRecord | null>(null);
  const [quote, setQuote] = useState('');
  const [manualText, setManualText] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineLimit,setTimelineLimit]=useState(30);
  useEffect(()=>setTimelineLimit(30),[patientId,filter,timelineSearch]);
  const timelineRecords = [...patient.records].sort((a,b)=>b.date.localeCompare(a.date)).filter(r => (filter === 'all' || r.type === filter) && `${diagnosisRecordTitle(r,diagnoses)} ${r.text} ${r.author} ${r.sourceTable || ''}`.toLocaleLowerCase().includes(timelineSearch.trim().toLocaleLowerCase()));
  const [automatic, setAutomatic] = useState(true);
  const coordinator = useRef(new RequestCoordinator<Brief>());
  const completedContext = useRef('');
  const contextKey = JSON.stringify({patientId,role,visitReason:reason.trim(),asOfDate});
  const revision = useRef(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (source && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal(); }, [source]);
  function reset() { coordinator.current.cancel(); completedContext.current = ''; revision.current++; setBrief(null); setSource(null); setError(''); setBusy(false); setManualText(''); }
  function selectPatient(p: Patient) { reset(); setPatientId(p.id); setReason(p.visitReason); setFilter('all'); setTimelineSearch(''); }
  function openSource(id: string, text = '') { setSource(patient.records.find(r => r.id === id) || null); setQuote(text); }
  const generate = useCallback(async () => {
    const current = ++revision.current; setBusy(true); setError(''); setSource(null); setBrief(null);
    try {
      const data = await coordinator.current.run(contextKey, async signal => {
        const response = await fetch('/api/brief', { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: contextKey });
        const value = await response.json();
        if (!response.ok) throw new Error(value.error || 'Could not generate brief.');
        return value as Brief;
      });
      if (revision.current === current) { setBrief(data); completedContext.current = contextKey; }
    } catch (e) { if (revision.current === current && !(e instanceof DOMException && e.name === 'AbortError')) setError(e instanceof Error ? e.message : 'Please retry.'); }
    finally { if (revision.current === current) setBusy(false); }
  }, [contextKey]);
  useEffect(() => {
    if (!automatic || manualOpen || reason.trim().length < 3 || !asOfDate || completedContext.current === contextKey) return;
    const timer = setTimeout(() => { void generate(); }, 700);
    return () => { clearTimeout(timer); coordinator.current.cancel(); revision.current++; setBusy(false); };
  }, [automatic, manualOpen, reason, asOfDate, contextKey, generate]);
  useEffect(() => () => { coordinator.current.cancel(); revision.current++; }, []);
  async function verifyManual() {
    coordinator.current.cancel(); const current = ++revision.current; setBusy(true); setError(''); setBrief(null); setSource(null);
    try {
      let content: unknown;
      try { content = JSON.parse(manualText); } catch { throw new Error('Paste the JSON response only, without markdown fences.'); }
      const response = await fetch('/api/brief/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, role, visitReason: reason, asOfDate, content }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (current === revision.current) { setBrief(data); completedContext.current = contextKey; setManualOpen(false); setManualText(''); }
    } catch (e) { if (current === revision.current) setError(e instanceof Error ? e.message : 'Verification failed.'); }
    finally { if (current === revision.current) setBusy(false); }
  }
  return <div className="shell">
    <aside className="sidebar">
      <a href="/" className="brand"><span className="brand-icon"><Layers3 size={22}/></span><span>contextcare<span className="brand-dot">.</span></span></a>
      
      <div className="nav-active"><Users size={18}/> Patients <span>{allTotal.toLocaleString('en')}</span></div>
      <a className="directory-search" href="/materials">Materials</a>
      <form action="/" className="patient-search"><label className="search"><Search size={16}/><input name="q" maxLength={100} aria-label="Search patients" placeholder="Search patients…" value={search} onChange={e => setSearch(e.target.value)}/></label><button className="directory-search" type="submit">Search</button></form>
      <nav className="directory-pages" aria-label="Patient directory pages"><div>{page>1?<a href={`/?q=${encodeURIComponent(query)}&page=${page-1}`}><ArrowLeft size={14}/>Previous</a>:<button disabled><ArrowLeft size={14}/>Previous</button>}{page*30<total?<a href={`/?q=${encodeURIComponent(query)}&page=${page+1}`}>Next<ArrowRight size={14}/></a>:<button disabled>Next<ArrowRight size={14}/></button>}</div><span>Page {page} of {Math.max(1,Math.ceil(total/30))}</span></nav>
      <div className="patient-list">{patients.map(p => <button key={p.id} className={'patient-button ' + (p.id === patientId ? 'selected' : '')} onClick={() => selectPatient(p)}><span className="avatar">{p.initials}</span><span className="patient-button-copy"><strong>{p.name}</strong><small>{p.age === null ? 'Age unavailable' : `${p.age} years`}{p.ageAsOfDate ? ` at ${date(p.ageAsOfDate)}` : ''}{p.visitReason ? ` · ${p.appointment.split(' · ')[0]}` : ''}</small>{p.visitReason&&<span>{p.visitReason}</span>}</span>{p.id === patientId && <span className="selection-dot"/>}</button>)}</div>
      <div className="sidebar-theme"><ThemeToggle/></div>
    </aside>
    <div className="workspace">
      <main>
        
        <div className="visit-context-card"><section className="patient-header"><div className="patient-identity"><span className="avatar large">{patient.initials}</span><div><div className="patient-name"><h1>{patient.name}</h1></div><p>{patient.age === null ? 'Age unavailable' : `${patient.age} years`}{patient.ageAsOfDate ? ` at ${date(patient.ageAsOfDate)}` : ''}</p></div></div><div className="record-count"><FileText size={19}/><div><strong>{patient.records.length} records</strong></div></div></section>
        <section className="brief-controls"><div><label htmlFor="visit-reason">Visit reason</label><input id="visit-reason" value={reason} maxLength={500} onChange={e => { reset(); setReason(e.target.value); }}/><label htmlFor="context-date">Records through</label><input id="context-date" type="date" value={asOfDate} onChange={e => { reset(); setAsOfDate(e.target.value); }}/></div><div className="role-control"><label htmlFor="professional-role">Role</label><div className="select-wrap"><Stethoscope size={17}/><select id="professional-role" value={role} onChange={e => { reset(); setRole(e.target.value as Role); }}>{roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select><ChevronDown size={14}/></div></div><button className="generate" disabled={busy || !asOfDate || reason.trim().length < 3} onClick={() => { void generate(); }}>{busy ? <LoaderCircle size={17} className="spin"/> : <Sparkles size={17}/>} {busy ? 'Preparing brief…' : brief ? 'Refresh brief' : 'Generate brief'}{!busy && <ArrowRight size={16}/>}</button></section>
        <label className="auto-prepare"><input type="checkbox" checked={automatic} onChange={e => { coordinator.current.cancel(); revision.current++; setBusy(false); setAutomatic(e.target.checked); }}/><span>Auto-refresh brief</span></label>{externalAllowed ? <details className="manual-panel" open={manualOpen} onToggle={e => setManualOpen(e.currentTarget.open)}><summary>Use a response from Intric <span>Manual transfer · source verification</span></summary><div className="manual-content"><p>Paste the JSON produced for this patient, role and visit reason. Quotes are checked against the current records; clinical meaning still requires review.</p><label htmlFor="intric-prompt">Request for the current context (authored fictional data only)</label><textarea id="intric-prompt" readOnly rows={4} value={buildBriefPrompt(patientAtDate(patient, asOfDate), role, reason)}/><p>Start a new Intric conversation for each patient and context. Instructions in the request cannot enforce the shared assistant’s tool or retention settings.</p><label htmlFor="manual-response">Assistant response (JSON only)</label><textarea id="manual-response" rows={7} maxLength={64000} value={manualText} onChange={e => setManualText(e.target.value)} placeholder='{"facts": [...], "missing": [...]}'/><div className="manual-actions"><small>Current context: {patient.id} · {role}. Changing context clears pasted output.</small><button className="generate" onClick={verifyManual} disabled={busy || !manualText.trim() || reason.trim().length < 3}><ShieldCheck size={16}/>{busy ? 'Checking…' : 'Verify and display'}</button></div></div></details> : null}
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="content-grid"><div className="overview-grid">
          <section className="card brief-card"><div className="card-heading"><div className="heading-icon mint"><Sparkles size={19}/></div><div><h3>Smart brief</h3></div><span className="tag green">{brief ? brief.mode === 'demo' ? 'Source preview' : brief.mode === 'manual' ? 'Manual AI import' : 'AI generated' : 'Awaiting generation'}</span></div>
            {!brief ? <div className="brief-empty"><div className="empty-art"><FileText size={32}/><span><Sparkles size={16}/></span></div><p>Enter a visit reason to generate the brief.</p></div> : <><details className="brief-note"><summary>Source coverage</summary><p>{brief.mode === 'demo' ? `Source-based preview · recorded information through ${asOfDate}. Review before use.` : brief.mode === 'manual' ? 'Manually transferred AI draft · source IDs and quotes checked. Origin and clinical meaning require review.' : brief.provenance?.provider === 'intric' ? `Intric · Swedish Hosted · ${brief.provenance.sourceCount} of ${brief.provenance.availableSourceCount} dated records analysed. Source quotes checked; professional review required.` : 'AI draft · evidence references checked. Clinical meaning requires professional review.'}</p>{!!brief.provenance?.restoredSourceExcerpts&&<p>{brief.provenance.restoredSourceExcerpts} medication source excerpts expanded to include intervening original fields. Values and source IDs were not changed.</p>}</details><div className="facts">{brief.facts.map((fact, i) => <article className="fact" key={i}><div className="fact-title"><h4>{fact.title}</h4><span className={'fact-status ' + (fact.status === 'needs-review' ? 'review' : '')}>{fact.status === 'documented' ? 'Documented' : 'Needs review'}</span></div><ReadableText text={fact.text} diagnoses={diagnoses}/><div className="sources">{fact.evidence.filter((e, index, all) => all.findIndex(item => item.sourceId === e.sourceId) === index).map((e, evidenceIndex) => <button key={`${e.sourceId}-${evidenceIndex}`} title={e.sourceId} onClick={() => openSource(e.sourceId, e.quote)}><FileText size={12}/>{patient.records.find(record => record.id === e.sourceId)?.title || 'Open source'}<ArrowUpRight size={12}/></button>)}</div></article>)}</div></>}
            
          </section>
          <section className="card missing-card"><div className="card-heading"><div className="heading-icon peach"><Search size={18}/></div><div><h3>Missing pieces</h3></div></div>{!brief ? <div className="missing-empty"><p>Missing information appears after generation.</p></div> : <div className="missing-list">{brief.missing.map((item, i) => <article key={i}><span className={'missing-status ' + item.status}>{item.status === 'not-found' ? 'Not established in selected sources' : 'Needs clarification'}</span><h4>{item.title}</h4><p>{item.explanation}</p><a className="source-link" href="#preparation-questions-title">Review suggested question <ArrowRight size={12}/></a></article>)}{brief.missing.length === 0 && <p>No gaps identified in this output. This does not imply a complete patient history.</p>}</div>}</section>
        </div><div className="preparation-grid">
          <section className="card timeline-card"><div className="card-heading"><div className="heading-icon lavender"><Activity size={19}/></div><div><h3>Patient timeline</h3></div><span className="count-badge">{patient.records.length} events</span></div><div className="filters" aria-label="Timeline filters">{['all', 'visit', 'medication', 'measurement', 'social'].map(f => <button className={filter === f ? 'active' : ''} key={f} onClick={() => setFilter(f)}>{({ all: 'All events', visit: 'Visits', medication: 'Medications', measurement: 'Measurements', social: 'Social care' } as Record<string, string>)[f]}</button>)}</div><div className="timeline-search-block"><label className="timeline-search">Search this patient’s records<input aria-label="Search this patient’s records" value={timelineSearch} maxLength={200} onChange={e=>setTimelineSearch(e.target.value)} placeholder="Complaint, medicine, author or source table…"/></label><p className="timeline-match-count" aria-live="polite">{timelineRecords.length} matching records</p></div><div className="timeline">{timelineRecords.slice(0,timelineLimit).map(r=>{const preview=summarizeSource(r);return <article key={r.id} className={'timeline-record ' + (source?.id===r.id?'highlighted':'')}><div className="timeline-record-heading"><div><small>{date(r.date)} · {r.type==='social'?'Social care':r.type}{r.date>asOfDate?' · After preparation date':''}</small><h4>{diagnosisRecordTitle(r,diagnoses)}</h4></div><button className="source-link" onClick={()=>openSource(r.id,preview.evidence[0]?.quote)}>Open source <ArrowUpRight size={14}/></button></div><ReadableText text={preview.text} diagnoses={diagnoses} sourceTable={r.sourceTable}/></article>})}{!timelineRecords.length&&<p className="empty-search">No matching records.</p>}{timelineRecords.length>timelineLimit&&<button className="show-more" onClick={()=>setTimelineLimit(n=>n+30)}>Show more records ({timelineRecords.length-timelineLimit} remaining)</button>}</div></section>
          <section className="card preparation-questions" aria-labelledby="preparation-questions-title">
            <div className="card-heading"><div className="heading-icon mint"><MessageCircle size={19}/></div><div><h3 id="preparation-questions-title">Questions before the visit</h3></div></div>
            {!brief ? <div className="questions-empty"><p>Questions appear after generation.</p></div> : !brief.questions?.length && !brief.missing.length ? <div className="questions-empty"><p>No questions in this output. Generate a new brief.</p></div> : <><p className="questions-context">For this visit: <strong>{brief.visitReason}</strong></p>{brief.missing.length>0&&<div className="gap-prompts"><h4>Clarify missing information first</h4>{brief.missing.map((gap,i)=><article key={i}><span className="missing-status">{gap.status==='not-found'?'Not established in selected sources':'Needs clarification'}</span><h4>{gap.title}</h4><p className="patient-question">{gap.question}</p><p className="question-rationale"><strong>Not yet established:</strong> {gap.explanation}</p></article>)}</div>}<ol className="preparation-question-list">{(brief.questions||[]).map((item,i)=><li key={i}><h4>{item.title}</h4><p className="patient-question">{item.question}</p><p className="question-rationale"><strong>What to clarify:</strong> {item.rationale}</p><div className="sources">{item.evidence.filter((e,index,all)=>all.findIndex(other=>other.sourceId===e.sourceId)===index).map(e=><button key={e.sourceId} title={e.sourceId} onClick={()=>openSource(e.sourceId,e.quote)}><FileText size={12}/>{patient.records.find(r=>r.id===e.sourceId)?.title || 'Open source'}<ArrowUpRight size={12}/></button>)}</div></li>)}</ol></>}
            
          </section>
        </div></div>
        <footer className="page-footer"><span>ContextCare</span><span>Synthetic data · Professional review required</span></footer>
      </main>
    </div>
    {source && <dialog ref={dialogRef} className="drawer-overlay" onCancel={() => setSource(null)} onClick={e => { if (e.target === e.currentTarget) setSource(null); }}><section className="source-drawer" role="dialog" aria-modal="true" aria-labelledby="source-title" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') setSource(null); }}><div className="drawer-top"><span><FileText size={17}/> ORIGINAL RECORD</span><button aria-label="Close source" autoFocus onClick={() => setSource(null)}><X size={20}/></button></div><h2 id="source-title">{diagnosisRecordTitle(source,diagnoses)}</h2><p className="source-meta">{date(source.date)}{!source.sourceTable&&<><br/>{source.author}</>}</p><details className="source-provenance"><summary>Source details</summary><p className="source-meta">{source.id}{source.sourceTable&&<><br/>Table: {source.sourceTable}<br/>Source key: {source.sourceKey}{source.contactId&&<><br/>Linked contact: {source.contactId}</>}</>}</p></details><div className="source-text"><SourceDocument text={source.text} quote={quote} record={source} diagnoses={diagnoses}/></div><div className="source-disclaimer"><ShieldCheck size={18}/><p>Source content is shown for review. Structured rows use labelled field values. A valid source reference does not certify an AI interpretation.</p></div><button className="drawer-done" onClick={() => setSource(null)}>Back to patient <ArrowRight size={16}/></button></section></dialog>}
  </div>;
}
