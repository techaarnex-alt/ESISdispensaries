'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowUpRight, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, FileText, FlaskConical, LayoutDashboard, LogOut, MapPin, Menu, Printer, Search, ShieldCheck, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Branch = { id: string; short: string; name: string; user: string };
type TestEntry = { id: string; locationId: string; patient: string; patientId: string; ip: string; age: string; sex: string; relationship: string; tests: string[]; status: 'Completed' | 'In progress' | 'Collected'; date: string };
type WebMCPTool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown };
type WebMCPContext = { registerTool: (tool: WebMCPTool, options?: { signal?: AbortSignal }) => void | Promise<void> };

const branches: Branch[] = [
  { id: 'sarojini', short: 'SN', name: 'ESI Dispensary Sarojani Nagar, Lucknow', user: 'sarojini' },
  { id: 'aishbagh', short: 'AB', name: 'ESI Dispensary Aishbagh, Lucknow', user: 'aishbagh' },
  { id: 'golaganj', short: 'GG', name: 'ESI Dispensary Golaganj (KGMU), Lucknow', user: 'golaganj' },
  { id: 'sandeela', short: 'SD', name: 'ESI Dispensary Sandeela, Hardoi', user: 'sandeela' },
  { id: 'sitapur', short: 'ST', name: 'ESI Dispensary Sitapur', user: 'sitapur' },
  { id: 'barabanki', short: 'BB', name: 'ESI Dispensary Barabanki', user: 'barabanki' },
  { id: 'raebareli', short: 'RB', name: 'ESI Dispensary Raebareli', user: 'raebareli' },
];
const records: TestEntry[] = [
  { id: 'LKO-SN-1042', locationId: 'sarojini', patient: 'Aarav Verma', patientId: 'IP-468211', ip: 'ESI-24817', age: '38', sex: 'Male', relationship: 'Self', tests: ['CBC', 'Blood Sugar'], status: 'Completed', date: '07 Sep 2026' },
  { id: 'LKO-SN-1041', locationId: 'sarojini', patient: 'Riya Singh', patientId: 'IP-518928', ip: 'ESI-24853', age: '27', sex: 'Female', relationship: 'W/O', tests: ['Thyroid Profile'], status: 'In progress', date: '07 Sep 2026' },
  { id: 'LKO-AB-0831', locationId: 'aishbagh', patient: 'Vikram Patel', patientId: 'IP-601284', ip: 'ESI-51192', age: '45', sex: 'Male', relationship: 'Self', tests: ['Lipid Profile', 'RFT'], status: 'Completed', date: '07 Sep 2026' },
  { id: 'LKO-GG-0525', locationId: 'golaganj', patient: 'Naina Gupta', patientId: 'IP-714638', ip: 'ESI-64931', age: '34', sex: 'Female', relationship: 'D/O', tests: ['CBC', 'Urine Routine'], status: 'Collected', date: '07 Sep 2026' },
  { id: 'HRD-SD-0314', locationId: 'sandeela', patient: 'Mohit Mishra', patientId: 'IP-379100', ip: 'ESI-29960', age: '52', sex: 'Male', relationship: 'Self', tests: ['LFT', 'Blood Sugar'], status: 'Completed', date: '07 Sep 2026' },
  { id: 'STP-ST-0716', locationId: 'sitapur', patient: 'Priya Yadav', patientId: 'IP-805416', ip: 'ESI-73184', age: '29', sex: 'Female', relationship: 'W/O', tests: ['HbA1c', 'RFT'], status: 'In progress', date: '07 Sep 2026' },
  { id: 'BBK-BB-0206', locationId: 'barabanki', patient: 'Sanjay Kumar', patientId: 'IP-402771', ip: 'ESI-81396', age: '41', sex: 'Male', relationship: 'Self', tests: ['CBC', 'LFT'], status: 'Completed', date: '07 Sep 2026' },
  { id: 'RBL-RB-0902', locationId: 'raebareli', patient: 'Kavita Sharma', patientId: 'IP-294833', ip: 'ESI-92824', age: '36', sex: 'Female', relationship: 'Self', tests: ['Thyroid Profile', 'Urine Routine'], status: 'Collected', date: '07 Sep 2026' },
];
const testGroups = [
  ['Hematology', ['CBC', 'ESR', 'Peripheral Smear']],
  ['Biochemistry', ['Blood Sugar', 'LFT', 'RFT', 'Lipid Profile', 'HbA1c']],
  ['Hormone & Electrolyte', ['Thyroid Profile', 'Serum Sodium', 'Serum Potassium']],
  ['Clinical Pathology', ['Urine Routine', 'Stool Routine']],
] as const;
const label = (branch: Branch) => branch.name.replace('ESI Dispensary ', '').replace(', Lucknow', '');

export default function Home() {
  const [location, setLocation] = useState<Branch | null>(null);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [section, setSection] = useState('dashboard');
  const [entries, setEntries] = useState(records);
  const [tests, setTests] = useState<string[]>(['CBC']);
  const [toast, setToast] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<TestEntry | null>(null);
  const locationRef = useRef<Branch | null>(null);
  const entriesRef = useRef(entries);
  locationRef.current = location;
  entriesRef.current = entries;

  const localEntries = useMemo(() => entries.filter((entry) => entry.locationId === location?.id), [entries, location]);
  const complete = localEntries.filter((entry) => entry.status === 'Completed').length;
  const visible = localEntries.filter((entry) => `${entry.patient} ${entry.patientId} ${entry.ip} ${entry.id}`.toLowerCase().includes(query.toLowerCase()));
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3200); };
  const login = (event: FormEvent) => {
    event.preventDefault();
    const found = branches.find((branch) => branch.user === user.trim().toLowerCase());
    if (!found || password !== 'ESI@2026') { setError('Use a location login ID and the demo password shown below.'); return; }
    setLocation(found); setSection('dashboard'); setError('');
  };
  const toggleTest = (test: string, checked: boolean) => setTests((current) => checked ? [...current, test] : current.filter((item) => item !== test));
  useEffect(() => {
    const context = (document as Document & { modelContext?: WebMCPContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: WebMCPTool) => {
      Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);
    };
    register({ name: 'read_location_register', title: 'Read location register', description: 'Read the signed-in dispensary name and the count of its visible laboratory records.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: () => {
      const branch = locationRef.current;
      if (!branch) throw new Error('A dispensary login is required.');
      return { location: branch.name, locationCode: branch.short, recordCount: entriesRef.current.filter((entry) => entry.locationId === branch.id).length };
    } });
    register({ name: 'create_location_test_entry', title: 'Create location test entry', description: 'Create a new laboratory test entry in the signed-in dispensary register. Use only after the patient details and requested tests are known.', inputSchema: { type: 'object', properties: { patient: { type: 'string' }, ipNumber: { type: 'string' }, age: { type: 'string' }, sex: { type: 'string', enum: ['Male', 'Female', 'Other'] }, relationship: { type: 'string' }, tests: { type: 'array', items: { type: 'string' }, minItems: 1 } }, required: ['patient', 'ipNumber', 'tests'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input) => {
      const data = input as { patient: string; ipNumber: string; age?: string; sex?: string; relationship?: string; tests: string[] };
      const branch = locationRef.current;
      if (!branch) throw new Error('A dispensary login is required.');
      if (!data.patient.trim() || !data.ipNumber.trim() || !Array.isArray(data.tests) || !data.tests.length) throw new Error('Patient, IP number, and at least one test are required.');
      const prefix = branch.id === 'sandeela' ? 'HRD-SD' : branch.id === 'sitapur' ? 'STP-ST' : branch.id === 'barabanki' ? 'BBK-BB' : branch.id === 'raebareli' ? 'RBL-RB' : `LKO-${branch.short}`;
      const item: TestEntry = { id: `${prefix}-${String(entriesRef.current.filter((entry) => entry.locationId === branch.id).length + 1043).padStart(4, '0')}`, locationId: branch.id, patient: data.patient.trim(), patientId: `IP-${Math.floor(100000 + Math.random() * 899999)}`, ip: data.ipNumber.trim(), age: data.age || '—', sex: data.sex || '—', relationship: data.relationship || 'Self', tests: data.tests, status: 'Collected', date: '07 Sep 2026' };
      setEntries((current) => [item, ...current]);
      setPreview(item); setSection('reports');
      return { reportNumber: item.id, location: branch.name, status: item.status };
    } });
    return () => lifecycle.abort();
  }, []);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!location || !tests.length) { notify('Select at least one laboratory test.'); return; }
    const form = new FormData(event.currentTarget); const patient = String(form.get('patient') || '').trim(); const ip = String(form.get('ip') || '').trim();
    if (!patient || !ip) { notify('Patient name and IP number are required.'); return; }
    const prefix = location.id === 'sandeela' ? 'HRD-SD' : location.id === 'sitapur' ? 'STP-ST' : location.id === 'barabanki' ? 'BBK-BB' : location.id === 'raebareli' ? 'RBL-RB' : `LKO-${location.short}`;
    const item: TestEntry = { id: `${prefix}-${String(localEntries.length + 1043).padStart(4, '0')}`, locationId: location.id, patient, patientId: `IP-${Math.floor(100000 + Math.random() * 899999)}`, ip, age: String(form.get('age') || '—'), sex: String(form.get('sex') || '—'), relationship: String(form.get('relationship') || 'Self'), tests, status: 'Collected', date: '07 Sep 2026' };
    setEntries((current) => [item, ...current]); setPreview(item); event.currentTarget.reset(); setTests(['CBC']); setSection('reports'); notify('Test entry created for this location only.');
  };

  if (!location) return <Login user={user} password={password} error={error} setUser={setUser} setPassword={setPassword} login={login} fill={(branch) => { setUser(branch.user); setPassword('ESI@2026'); setError(''); }} />;
  const pending = localEntries.length - complete;
  return <main className="app-shell">
    <Sidebar location={location} active={section} open={navOpen} change={(next) => { setSection(next); setNavOpen(false); }} signOut={() => { setLocation(null); setPassword(''); setNavOpen(false); }} close={() => setNavOpen(false)} />
    {navOpen && <button aria-label="Close navigation" className="sidebar-overlay" onClick={() => setNavOpen(false)} />}
    <section className="app-main"><header className="app-header"><Button variant="ghost" size="icon" className="menu-button" onClick={() => setNavOpen(true)} aria-label="Open menu"><Menu /></Button><div className="breadcrumb"><span>ESI Lucknow Zone</span><ChevronRight size={14} /><strong>{section === 'dashboard' ? 'Overview' : section === 'entry' ? 'New test entry' : 'Reports'}</strong></div><div className="header-user"><div className="header-date"><CalendarDays size={15} /> 07 Sep 2026</div><div className="user-avatar">{location.short}</div></div></header>
      <div className="page-content">
        {section === 'dashboard' && <Dashboard location={location} entries={localEntries} complete={complete} pending={pending} goEntry={() => setSection('entry')} goReports={() => setSection('reports')} />}
        {section === 'entry' && <EntryForm location={location} tests={tests} toggle={toggleTest} submit={submit} />}
        {section === 'reports' && <Reports location={location} entries={visible} query={query} setQuery={setQuery} preview={preview} setPreview={setPreview} />}
      </div>
    </section>
    {toast && <div className="toast-message"><CheckCircle2 size={18} />{toast}</div>}
  </main>;
}

function Login({ user, password, error, setUser, setPassword, login, fill }: { user: string; password: string; error: string; setUser: (value: string) => void; setPassword: (value: string) => void; login: (event: FormEvent) => void; fill: (branch: Branch) => void }) {
  return <main className="login-shell"><section className="login-brand"><div className="brand-topline"><span className="brand-dot" /> UTTAR PRADESH ESI</div><div className="login-logo-wrap"><img src="/up-esis-logo.jpeg" alt="Uttar Pradesh ESI logo" className="login-logo" /></div><p className="eyebrow light">ESI dispensaries · Lucknow zone</p><h1>Laboratory entries,<br /><em>kept local.</em></h1><p className="brand-copy">A focused demo for registering tests and issuing reports separately for every dispensary.</p><div className="security-note"><ShieldCheck size={18} /> One location login sees only its own patients, tests and reports.</div></section>
    <section className="login-panel"><div className="login-content"><div className="mobile-logo"><img src="/up-esis-logo.jpeg" alt="Uttar Pradesh ESI logo" /></div><p className="eyebrow">Secure demonstration</p><h2>Sign in to your dispensary</h2><p className="muted-copy">Use the login assigned to your location. Reports and test registers stay separated by location.</p><form onSubmit={login} className="login-form"><label>Location login ID<Input value={user} onChange={(event) => setUser(event.target.value)} placeholder="e.g. sarojini" autoComplete="username" /></label><label>Password<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" autoComplete="current-password" /></label>{error && <p className="form-error">{error}</p>}<Button type="submit" className="login-button">Sign in <ArrowUpRight /></Button></form>
      <div className="demo-creds"><div className="demo-creds-heading"><span>7 demo location logins</span><b>Password: ESI@2026</b></div><div className="credential-grid">{branches.map((branch) => <button type="button" key={branch.id} onClick={() => fill(branch)} className="credential-card"><span>{branch.short}</span><strong>{branch.user}</strong><small>{label(branch)}</small></button>)}</div></div></div></section></main>;
}

function Sidebar({ location, active, open, change, signOut, close }: { location: Branch; active: string; open: boolean; change: (value: string) => void; signOut: () => void; close: () => void }) {
  const items = [[LayoutDashboard, 'dashboard', 'Dashboard'], [ClipboardList, 'entry', 'New test entry'], [FileText, 'reports', 'Reports']] as const;
  return <nav className={`sidebar ${open ? 'open' : ''}`} aria-label="Portal navigation"><div className="sidebar-brand"><img src="/up-esis-logo.jpeg" alt="" /><div><strong>ESI Lab Portal</strong><span>Lucknow Zone</span></div><Button variant="ghost" size="icon-sm" className="close-nav" onClick={close} aria-label="Close menu"><X /></Button></div><div className="location-chip"><MapPin size={15} /><div><span>Signed in location</span><strong>{location.short} · {label(location)}</strong></div></div><div className="nav-links">{items.map(([Icon, id, text]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => change(id)}><Icon size={18} />{text}</button>)}</div><div className="sidebar-footer"><div className="demo-badge"><ShieldCheck size={16} /> Demo mode</div><Button variant="ghost" onClick={signOut}><LogOut /> Sign out</Button></div></nav>;
}

function Dashboard({ location, entries, complete, pending, goEntry, goReports }: { location: Branch; entries: TestEntry[]; complete: number; pending: number; goEntry: () => void; goReports: () => void }) {
  const rate = entries.length ? Math.round((complete / entries.length) * 100) : 0;
  return <><div className="page-heading"><div><p className="eyebrow">Today at your location</p><h1>{label(location)}</h1><p className="muted-copy">Your register is isolated from all other ESI dispensaries.</p></div><Button onClick={goEntry}><ClipboardList /> New test entry</Button></div><div className="stat-grid"><Stat icon={<Users />} value={String(entries.length).padStart(2, '0')} label="Tests registered" accent="orange" detail="Today’s register" /><Stat icon={<CheckCircle2 />} value={String(complete).padStart(2, '0')} label="Reports completed" accent="green" detail="Ready to issue" /><Stat icon={<FlaskConical />} value={String(pending).padStart(2, '0')} label="In lab queue" accent="blue" detail="Collected / processing" /><Stat icon={<Activity />} value={`${rate}%`} label="Completion rate" accent="yellow" detail="Of registered tests" /></div>
    <div className="dashboard-grid"><section className="panel recent-panel"><div className="panel-heading"><div><h2>Today’s test register</h2><p>Latest patients at this location</p></div><Button variant="ghost" size="sm" onClick={goReports}>All reports <ChevronRight /></Button></div><EntryTable entries={entries.slice(0, 5)} select={() => goReports()} /></section><section className="panel workflow-panel"><div className="panel-heading"><div><h2>Lab workflow</h2><p>Current register status</p></div><span className="completion-pill">{rate}% complete</span></div><div className="workflow-ring" style={{ '--progress': `${rate * 3.6}deg` } as React.CSSProperties}><div><strong>{complete}</strong><span>ready</span></div></div><div className="workflow-list"><span><i className="dot completed" />Completed <b>{complete}</b></span><span><i className="dot processing" />In progress <b>{entries.filter((entry) => entry.status === 'In progress').length}</b></span><span><i className="dot collected" />Collected <b>{entries.filter((entry) => entry.status === 'Collected').length}</b></span></div></section></div>
    <section className="location-lock"><div className="lock-icon"><ShieldCheck /></div><div><h3>Location data boundary is active</h3><p>Only <strong>{location.name}</strong> records are shown in this session. Other dispensaries cannot appear in this report register.</p></div><span>LOCATION: {location.short}</span></section></>;
}
function Stat({ icon, value, label, detail, accent }: { icon: React.ReactNode; value: string; label: string; detail: string; accent: string }) { return <section className={`stat-card ${accent}`}><div className="stat-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div><small>{detail}</small></section>; }

function EntryForm({ location, tests, toggle, submit }: { location: Branch; tests: string[]; toggle: (test: string, checked: boolean) => void; submit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <><div className="page-heading"><div><p className="eyebrow">Patient registration</p><h1>New test entry</h1><p className="muted-copy">The dispensary field is locked to <strong>{location.name}</strong>.</p></div><div className="location-lock-small"><MapPin size={16} />{location.short}</div></div><form className="entry-layout" onSubmit={submit}><section className="panel patient-panel"><div className="panel-heading"><div><h2>Patient details</h2><p>Enter information from the IP card</p></div><span className="required-note">* Required fields</span></div><div className="form-grid"><label className="field full">IP number *<Input name="ip" placeholder="e.g. ESI-24817" /></label><label className="field full">Patient name *<Input name="patient" placeholder="Enter full name" /></label><label className="field">Age<Input name="age" type="number" min="0" max="120" placeholder="Years" /></label><label className="field">Sex<select name="sex" defaultValue=""><option value="" disabled>Select sex</option><option>Male</option><option>Female</option><option>Other</option></select></label><label className="field full">Relationship with IP<select name="relationship" defaultValue="Self"><option>Self</option><option>H/O (Husband of)</option><option>W/O (Wife of)</option><option>S/O (Son of)</option><option>D/O (Daughter of)</option><option>Father</option><option>Mother</option><option>Brother</option><option>Sister</option></select></label><div className="field full"><span>Dispensary name</span><div className="locked-field"><MapPin size={16} />{location.name}</div></div></div></section>
    <section className="panel test-panel"><div className="panel-heading"><div><h2>Select tests</h2><p>Choose one or more tests for this patient</p></div><span className="selected-count">{tests.length} selected</span></div><div className="test-groups">{testGroups.map(([group, values]) => <div className="test-group" key={group}><h3>{group}</h3>{values.map((test) => <label key={test} className="test-option"><Checkbox checked={tests.includes(test)} onCheckedChange={(value) => toggle(test, Boolean(value))} /><span>{test}</span></label>)}</div>)}</div></section>
    <div className="entry-actions"><p><ShieldCheck size={16} /> Entry will be saved to <strong>{location.short}</strong> only.</p><div><Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button><Button type="submit"><FlaskConical /> Create test entry</Button></div></div></form></>;
}

function Reports({ location, entries, query, setQuery, preview, setPreview }: { location: Branch; entries: TestEntry[]; query: string; setQuery: (value: string) => void; preview: TestEntry | null; setPreview: (entry: TestEntry | null) => void }) {
  const ready = entries.filter((entry) => entry.status === 'Completed');
  return <><div className="page-heading"><div><p className="eyebrow">Location-specific register</p><h1>Reports</h1><p className="muted-copy">Showing reports created at <strong>{location.name}</strong> only.</p></div><Button variant="outline" onClick={() => window.print()}><Printer /> Print register</Button></div><Tabs defaultValue="register" className="report-tabs"><TabsList variant="line"><TabsTrigger value="register"><ClipboardList /> Test register</TabsTrigger><TabsTrigger value="ready"><CheckCircle2 /> Completed reports</TabsTrigger></TabsList><TabsContent value="register"><ReportTable entries={entries} query={query} setQuery={setQuery} select={setPreview} /></TabsContent><TabsContent value="ready"><ReportTable entries={ready} query="" setQuery={() => undefined} select={setPreview} /></TabsContent></Tabs>{preview && <Preview entry={preview} location={location} close={() => setPreview(null)} />}</>;
}
function ReportTable({ entries, query, setQuery, select }: { entries: TestEntry[]; query: string; setQuery: (value: string) => void; select: (entry: TestEntry) => void }) { return <section className="panel reports-panel"><div className="reports-toolbar"><div className="report-count"><strong>{entries.length}</strong> entries at this location</div>{query !== undefined && <div className="search-field"><Search size={17} /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patient, IP or report no." /></div>}</div><EntryTable entries={entries} select={select} /></section>; }
function EntryTable({ entries, select }: { entries: TestEntry[]; select: (entry: TestEntry) => void }) { return <Table className="entry-table"><TableHeader><TableRow><TableHead>Report no.</TableHead><TableHead>Patient</TableHead><TableHead>Tests</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{entries.length ? entries.map((entry) => <TableRow key={entry.id}><TableCell><strong className="report-id">{entry.id}</strong><small>{entry.date}</small></TableCell><TableCell><strong>{entry.patient}</strong><small>{entry.patientId} · {entry.age} yrs · {entry.sex}</small></TableCell><TableCell><div className="test-tags">{entry.tests.slice(0, 2).map((test) => <span key={test}>{test}</span>)}{entry.tests.length > 2 && <span>+{entry.tests.length - 2}</span>}</div></TableCell><TableCell><span className={`status status-${entry.status.replace(' ', '-').toLowerCase()}`}>{entry.status}</span></TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => select(entry)}>View <ChevronRight /></Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={5}><div className="empty-table"><FileText /><strong>No reports found</strong><span>Try a different patient or report number.</span></div></TableCell></TableRow>}</TableBody></Table>; }
function Preview({ entry, location, close }: { entry: TestEntry; location: Branch; close: () => void }) { return <div className="report-drawer-backdrop" role="presentation"><aside className="report-drawer" role="dialog" aria-modal="true" aria-label="Report preview"><div className="drawer-header"><div><p className="eyebrow">Report preview</p><h2>{entry.id}</h2></div><Button variant="ghost" size="icon" onClick={close} aria-label="Close report"><X /></Button></div><div className="report-paper"><div className="report-logo-line"><img src="/up-esis-logo.jpeg" alt="" /><div><strong>ESIC DISPENSARIES, LUCKNOW ZONE</strong><span>{location.name}</span></div></div><div className="report-title">LABORATORY INVESTIGATION REPORT</div><div className="patient-strip"><div><span>Patient name</span><strong>{entry.patient}</strong></div><div><span>Patient ID</span><strong>{entry.patientId}</strong></div><div><span>Age / Sex</span><strong>{entry.age} / {entry.sex}</strong></div><div><span>IP number</span><strong>{entry.ip}</strong></div></div><div className="result-list">{entry.tests.map((test, index) => <div key={test}><strong>{test}</strong><span>{entry.status === 'Completed' ? index === 0 ? 'Within reference range' : 'Result verified' : 'Awaiting laboratory verification'}</span></div>)}</div><div className="report-sign"><div><span>Specimen status</span><strong>{entry.status}</strong></div><div><span>Authorised signatory</span><strong>Laboratory Technician</strong></div></div><p className="report-footnote">This is a demonstration layout. Clinical values and authorisation must be validated by the authorised laboratory before issue.</p></div><div className="drawer-actions"><Button variant="outline" onClick={close}>Close</Button><Button onClick={() => window.print()}><Printer /> Print report</Button></div></aside></div>; }
