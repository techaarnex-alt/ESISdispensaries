'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Activity, ArrowUpRight, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, FileText, FlaskConical, LayoutDashboard, LogOut, MapPin, Menu, MessageSquare, Pencil, Plus, Printer, Save, Search, ShieldCheck, Star, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Branch = { id: string; short: string; name: string; user: string };
type TestEntry = { recordId: number; id: string; patient: string; patientId: string; ip: string; age: string; sex: string; relationship: string; ipHolderName: string; tests: string[]; status: 'Completed' | 'In progress' | 'Collected'; date: string };
type CustomerReview = { id: number; rating: number; reviewerName: string; message: string; date: string };
type TestDefinition = { id: number; name: string; category: string; ratePaise: number; referenceRange: string; active: boolean };
type SelectedTest = Pick<TestDefinition, 'id' | 'name' | 'ratePaise'>;
type TestResult = { id: number; testName: string; ratePaise: number; resultValue: string; resultNote: string; resultStatus: 'Pending' | 'In progress' | 'Completed' };
type ResultDetail = { entry: Omit<TestEntry, 'tests'>; results: TestResult[] };
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
const label = (branch: Branch) => branch.name.replace('ESI Dispensary ', '').replace(', Lucknow', '');
const money = (paise: number) => `₹${(paise / 100).toFixed(2)}`;
const paiseFromInput = (value: FormDataEntryValue | null) => {
  const amount = Number((typeof value === 'string' ? value : '').trim());
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
};

export default function Home() {
  const [location, setLocation] = useState<Branch | null>(null);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [section, setSection] = useState('dashboard');
  const [entries, setEntries] = useState<TestEntry[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [testCatalogue, setTestCatalogue] = useState<TestDefinition[]>([]);
  const [tests, setTests] = useState<SelectedTest[]>([]);
  const [entryFormVersion, setEntryFormVersion] = useState(0);
  const [toast, setToast] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<TestEntry | null>(null);
  const locationRef = useRef<Branch | null>(null);
  const entriesRef = useRef(entries);
  locationRef.current = location;
  entriesRef.current = entries;

  const localEntries = entries;
  const complete = localEntries.filter((entry) => entry.status === 'Completed').length;
  const visible = localEntries.filter((entry) => `${entry.patient} ${entry.patientId} ${entry.ip} ${entry.id}`.toLowerCase().includes(query.toLowerCase()));
  const notify = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3200); }, []);
  const loadDashboard = async () => {
    const response = await fetch('/api/dashboard');
    if (!response.ok) return;
    const data = await response.json() as { entries: TestEntry[]; reviews: CustomerReview[] };
    setEntries(data.entries); setReviews(data.reviews);
  };
  const loadTests = async () => {
    const response = await fetch('/api/tests');
    if (!response.ok) return;
    const data = await response.json() as { tests: TestDefinition[] };
    setTestCatalogue(data.tests);
  };
  useEffect(() => {
    fetch('/api/auth/session').then(async (response) => {
      if (response.ok) { const data = await response.json() as { branch: Branch }; setLocation(data.branch); }
    }).catch(() => undefined).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (location) { void loadDashboard(); void loadTests(); } }, [location]);
  const login = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user, password }) });
    const data = await response.json().catch(() => ({})) as { branch?: Branch; error?: string };
    if (!response.ok || !data.branch) { setError(data.error || 'Unable to sign in.'); return; }
    setLocation(data.branch); setSection('dashboard'); setError('');
  };
  const toggleTest = (test: TestDefinition, checked: boolean) => setTests((current) => checked ? [...current, { id: test.id, name: test.name, ratePaise: test.ratePaise }] : current.filter((item) => item.id !== test.id));
  const updateSelectedRate = (id: number, ratePaise: number) => setTests((current) => current.map((item) => item.id === id ? { ...item, ratePaise } : item));
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
      return { location: branch.name, locationCode: branch.short, recordCount: entriesRef.current.length };
    } });
    register({ name: 'create_location_test_entry', title: 'Create location test entry', description: 'Create a new laboratory test entry in the signed-in dispensary register. The next IP number is assigned automatically when it is saved.', inputSchema: { type: 'object', properties: { patient: { type: 'string' }, age: { type: 'string' }, sex: { type: 'string', enum: ['Male', 'Female', 'Other'] }, relationship: { type: 'string' }, ipHolderName: { type: 'string' }, tests: { type: 'array', items: { type: 'string' }, minItems: 1 } }, required: ['patient', 'tests'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: async (input) => {
      const data = input as { patient: string; age?: string; sex?: string; relationship?: string; ipHolderName?: string; tests: string[] };
      const branch = locationRef.current;
      if (!branch) throw new Error('A dispensary login is required.');
      if (!data.patient.trim() || !Array.isArray(data.tests) || !data.tests.length) throw new Error('Patient and at least one test are required.');
      const response = await fetch('/api/entries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
      const payload = await response.json().catch(() => ({})) as { entry?: TestEntry; error?: string };
      if (!response.ok || !payload.entry) throw new Error(payload.error || 'Unable to create the test entry.');
      const item = payload.entry;
      setEntries((current) => [item, ...current]);
      setPreview(item); setSection('reports');
      return { reportNumber: item.id, location: branch.name, status: item.status };
    } });
    return () => lifecycle.abort();
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!location || !tests.length) { notify('Select at least one laboratory test.'); return; }
    const formElement = event.currentTarget;
    const form = new FormData(formElement); const patient = String(form.get('patient') || '').trim();
    if (!patient) { notify('Patient name is required.'); return; }
    const response = await fetch('/api/entries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ patient, age: String(form.get('age') || ''), sex: String(form.get('sex') || ''), relationship: String(form.get('relationship') || 'Self'), ipHolderName: String(form.get('ipHolderName') || ''), tests: tests.map((test) => ({ testId: test.id, ratePaise: test.ratePaise })) }) });
    const data = await response.json().catch(() => ({})) as { entry?: TestEntry; error?: string };
    if (!response.ok || !data.entry) { notify(data.error || 'Unable to save this test entry.'); return; }
    formElement.reset(); setEntries((current) => [data.entry!, ...current]); setPreview(data.entry); setTests([]); setEntryFormVersion((current) => current + 1); setSection('reports'); notify(`Test entry saved. IP ${data.entry.ip} was assigned automatically.`);
  };
  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setLocation(null); setPassword(''); setEntries([]); setReviews([]); setTestCatalogue([]); setTests([]); setNavOpen(false);
  };

  if (!location) return <Login user={user} password={password} error={error} loading={loading} setUser={setUser} setPassword={setPassword} login={login} fill={(branch) => { setUser(branch.user); setPassword('ESI@2026'); setError(''); }} />;
  const pending = localEntries.length - complete;
  return <main className="app-shell">
    <Sidebar location={location} active={section} open={navOpen} change={(next) => { setSection(next); setNavOpen(false); }} signOut={() => void signOut()} close={() => setNavOpen(false)} />
    {navOpen && <button aria-label="Close navigation" className="sidebar-overlay" onClick={() => setNavOpen(false)} />}
    <section className="app-main"><header className="app-header"><Button variant="ghost" size="icon" className="menu-button" onClick={() => setNavOpen(true)} aria-label="Open menu"><Menu /></Button><div className="breadcrumb"><span>ESI Lucknow Zone</span><ChevronRight size={14} /><strong>{section === 'dashboard' ? 'Overview' : section === 'entry' ? 'New test entry' : section === 'results' ? 'Result entry' : section === 'tests' ? 'Test catalogue' : section === 'reports' ? 'Reports' : 'Customer reviews'}</strong></div><div className="header-user"><div className="header-date"><CalendarDays size={15} /> 08 Sep 2026</div><div className="user-avatar">{location.short}</div></div></header>
      <div className="page-content">
        {section === 'dashboard' && <Dashboard location={location} entries={localEntries} complete={complete} pending={pending} goEntry={() => setSection('entry')} goReports={() => setSection('reports')} />}
        {section === 'entry' && <EntryForm key={entryFormVersion} location={location} catalogue={testCatalogue} tests={tests} toggle={toggleTest} updateRate={updateSelectedRate} submit={submit} goTests={() => setSection('tests')} />}
        {section === 'results' && <ResultEntry location={location} entries={localEntries} notify={notify} refresh={() => void loadDashboard()} />}
        {section === 'tests' && <TestCatalogue location={location} tests={testCatalogue} setTests={setTestCatalogue} notify={notify} />}
        {section === 'reports' && <Reports location={location} entries={visible} query={query} setQuery={setQuery} preview={preview} setPreview={setPreview} />}
        {section === 'reviews' && <Reviews location={location} reviews={reviews} onAdd={(review) => setReviews((current) => [review, ...current])} notify={notify} />}
      </div>
    </section>
    {toast && <div className="toast-message"><CheckCircle2 size={18} />{toast}</div>}
  </main>;
}

function Login({ user, password, error, loading, setUser, setPassword, login, fill }: { user: string; password: string; error: string; loading: boolean; setUser: (value: string) => void; setPassword: (value: string) => void; login: (event: FormEvent) => void; fill: (branch: Branch) => void }) {
  return <main className="login-shell"><section className="login-brand"><div className="brand-topline"><span className="brand-dot" /> UTTAR PRADESH ESI</div><div className="login-logo-wrap"><img src="/up-esis-logo.jpeg" alt="Uttar Pradesh ESI logo" className="login-logo" /></div><p className="eyebrow light">ESI dispensaries · Lucknow zone</p><h1>Laboratory entries,<br /><em>kept private.</em></h1><p className="brand-copy">A secure portal for registering tests and issuing reports separately for every dispensary.</p><div className="security-note"><ShieldCheck size={18} /> One location login sees only its own patients, tests and reports.</div></section>
    <section className="login-panel"><div className="login-content"><div className="mobile-logo"><img src="/up-esis-logo.jpeg" alt="Uttar Pradesh ESI logo" /></div><p className="eyebrow">Secure location access</p><h2>Sign in to your dispensary</h2><p className="muted-copy">The server uses this login to select one branch. It will only return records and reviews belonging to that branch.</p><form onSubmit={login} className="login-form"><label>Location login ID<Input value={user} onChange={(event) => setUser(event.target.value)} placeholder="e.g. sarojini" autoComplete="username" /></label><label>Password<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" autoComplete="current-password" /></label>{error && <p className="form-error">{error}</p>}<Button type="submit" className="login-button" disabled={loading}>{loading ? 'Checking secure session…' : <>Sign in <ArrowUpRight /></>}</Button></form>
      <div className="demo-creds"><div className="demo-creds-heading"><span>7 location logins</span><b>Password: ESI@2026</b></div><div className="credential-grid">{branches.map((branch) => <button type="button" key={branch.id} onClick={() => fill(branch)} className="credential-card"><span>{branch.short}</span><strong>{branch.user}</strong><small>{label(branch)}</small></button>)}</div></div></div></section></main>;
}

function Sidebar({ location, active, open, change, signOut, close }: { location: Branch; active: string; open: boolean; change: (value: string) => void; signOut: () => void; close: () => void }) {
  const items = [[LayoutDashboard, 'dashboard', 'Dashboard'], [ClipboardList, 'entry', 'New test entry'], [FlaskConical, 'results', 'Result entry'], [CircleDollarSign, 'tests', 'Test catalogue & rates'], [FileText, 'reports', 'Reports'], [MessageSquare, 'reviews', 'Customer reviews']] as const;
  return <nav className={`sidebar ${open ? 'open' : ''}`} aria-label="Portal navigation"><div className="sidebar-brand"><img src="/up-esis-logo.jpeg" alt="" /><div><strong>ESI Lab Portal</strong><span>Lucknow Zone</span></div><Button variant="ghost" size="icon-sm" className="close-nav" onClick={close} aria-label="Close menu"><X /></Button></div><div className="location-chip"><MapPin size={15} /><div><span>Signed in location</span><strong>{location.short} · {label(location)}</strong></div></div><div className="nav-links">{items.map(([Icon, id, text]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => change(id)}><Icon size={18} />{text}</button>)}</div><div className="sidebar-footer"><div className="demo-badge"><ShieldCheck size={16} /> Demo mode</div><Button variant="ghost" onClick={signOut}><LogOut /> Sign out</Button></div></nav>;
}

function Dashboard({ location, entries, complete, pending, goEntry, goReports }: { location: Branch; entries: TestEntry[]; complete: number; pending: number; goEntry: () => void; goReports: () => void }) {
  const rate = entries.length ? Math.round((complete / entries.length) * 100) : 0;
  const registeredTests = entries.reduce((total, entry) => total + entry.tests.length, 0);
  return <><div className="page-heading"><div><p className="eyebrow">Today at your location</p><h1>{label(location)}</h1><p className="muted-copy">Your register is isolated from all other ESI dispensaries.</p></div><Button onClick={goEntry}><ClipboardList /> New test entry</Button></div><div className="stat-grid"><Stat icon={<Users />} value={String(registeredTests).padStart(2, '0')} label="Tests registered" accent="orange" detail="Across patient entries" /><Stat icon={<CheckCircle2 />} value={String(complete).padStart(2, '0')} label="Reports completed" accent="green" detail="Ready to issue" /><Stat icon={<FlaskConical />} value={String(pending).padStart(2, '0')} label="In lab queue" accent="blue" detail="Collected / processing" /><Stat icon={<Activity />} value={`${rate}%`} label="Completion rate" accent="yellow" detail="Of registered tests" /></div>
    <div className="dashboard-grid"><section className="panel recent-panel"><div className="panel-heading"><div><h2>Today’s test register</h2><p>Latest patients at this location</p></div><Button variant="ghost" size="sm" onClick={goReports}>All reports <ChevronRight /></Button></div><EntryTable entries={entries.slice(0, 5)} select={() => goReports()} /></section><section className="panel workflow-panel"><div className="panel-heading"><div><h2>Lab workflow</h2><p>Current register status</p></div><span className="completion-pill">{rate}% complete</span></div><div className="workflow-ring" style={{ '--progress': `${rate * 3.6}deg` } as React.CSSProperties}><div><strong>{complete}</strong><span>ready</span></div></div><div className="workflow-list"><span><i className="dot completed" />Completed <b>{complete}</b></span><span><i className="dot processing" />In progress <b>{entries.filter((entry) => entry.status === 'In progress').length}</b></span><span><i className="dot collected" />Collected <b>{entries.filter((entry) => entry.status === 'Collected').length}</b></span></div></section></div>
    <section className="location-lock"><div className="lock-icon"><ShieldCheck /></div><div><h3>Location data boundary is active</h3><p>Only <strong>{location.name}</strong> records are shown in this session. Other dispensaries cannot appear in this report register.</p></div><span>LOCATION: {location.short}</span></section></>;
}
function Stat({ icon, value, label, detail, accent }: { icon: React.ReactNode; value: string; label: string; detail: string; accent: string }) { return <section className={`stat-card ${accent}`}><div className="stat-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div><small>{detail}</small></section>; }

function EntryForm({ location, catalogue, tests, toggle, updateRate, submit, goTests }: { location: Branch; catalogue: TestDefinition[]; tests: SelectedTest[]; toggle: (test: TestDefinition, checked: boolean) => void; updateRate: (id: number, ratePaise: number) => void; submit: (event: FormEvent<HTMLFormElement>) => void; goTests: () => void }) {
  const groups = catalogue.reduce<Record<string, TestDefinition[]>>((all, test) => { (all[test.category] ||= []).push(test); return all; }, {});
  const [title, setTitle] = useState('');
  const [sex, setSex] = useState('');
  const selectTitle = (value: string) => {
    setTitle(value);
    if (value === 'Mr') setSex('Male');
    if (value === 'Mrs' || value === 'Ms') setSex('Female');
  };
  return <><div className="page-heading"><div><p className="eyebrow">Patient registration</p><h1>New test entry</h1><p className="muted-copy">The dispensary field is locked to <strong>{location.name}</strong>.</p></div><div className="location-lock-small"><MapPin size={16} />{location.short}</div></div><form className="entry-layout" onSubmit={submit}><section className="panel patient-panel"><div className="panel-heading"><div><h2>Patient details</h2><p>Complete the patient information; the IP number is assigned when saved.</p></div><span className="required-note">* Required fields</span></div><div className="form-grid"><div className="field full"><span>IP number</span><div className="locked-field">Automatically generated when this entry is saved</div></div><label className="field">Title<select value={title} onChange={(event) => selectTitle(event.target.value)}><option value="">Select title</option><option>Mr</option><option>Mrs</option><option>Ms</option></select></label><label className="field">Patient name *<Input name="patient" placeholder="Enter full name" /></label><label className="field">Age<Input name="age" type="number" min="0" max="120" placeholder="Years" /></label><label className="field">Sex<select name="sex" value={sex} onChange={(event) => setSex(event.target.value)}><option value="" disabled>Select sex</option><option>Male</option><option>Female</option><option>Other</option></select></label><label className="field">Relationship with IP<select name="relationship" defaultValue="Self"><option>Self</option><option>H/O (Husband of)</option><option>W/O (Wife of)</option><option>S/O (Son of)</option><option>D/O (Daughter of)</option><option>Father</option><option>Mother</option><option>Brother</option><option>Sister</option></select></label><label className="field">Name of IP holder / related person<Input name="ipHolderName" maxLength={100} placeholder="Enter name, if applicable" /></label><div className="field full"><span>Dispensary name</span><div className="locked-field"><MapPin size={16} />{location.name}</div></div></div></section>
    <section className="panel test-panel"><div className="panel-heading"><div><h2>Select tests and set rates</h2><p>Rates are editable for this new entry; the saved report keeps its own rate snapshot.</p></div><span className="selected-count">{tests.length} selected</span></div>{catalogue.length ? <><div className="test-groups">{Object.entries(groups).map(([group, values]) => <div className="test-group" key={group}><h3>{group}</h3>{values.map((test) => <label key={test.id} className="test-option"><Checkbox checked={tests.some((item) => item.id === test.id)} onCheckedChange={(value) => toggle(test, Boolean(value))} /><span>{test.name}</span><em>{money(test.ratePaise)}</em></label>)}</div>)}</div>{tests.length > 0 && <div className="selected-rates"><h3>Selected test rates</h3>{tests.map((test) => <label key={test.id}><span>{test.name}</span><div><small>₹</small><Input type="number" min="0" step="0.01" value={(test.ratePaise / 100).toFixed(2)} onChange={(event) => { const rate = paiseFromInput(event.target.value); if (rate !== null) updateRate(test.id, rate); }} /></div></label>)}</div>}</> : <div className="empty-catalogue"><FlaskConical /><strong>No tests have been added for this location yet.</strong><span>Add your first test and its rate before registering a patient.</span><Button type="button" size="sm" onClick={goTests}><Plus /> Add test</Button></div>}</section>
    <div className="entry-actions"><p><ShieldCheck size={16} /> Entry will be saved to <strong>{location.short}</strong> only.</p><div><Button type="button" variant="outline" onClick={() => history.back()}>Cancel</Button><Button type="submit" disabled={!catalogue.length}><FlaskConical /> Create test entry</Button></div></div></form></>;
}

function TestCatalogue({ location, tests, setTests, notify }: { location: Branch; tests: TestDefinition[]; setTests: (value: TestDefinition[] | ((current: TestDefinition[]) => TestDefinition[])) => void; notify: (message: string) => void }) {
  const [saving, setSaving] = useState(false);
  const addTest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const ratePaise = paiseFromInput(form.get('rate'));
    if (ratePaise === null) { notify('Enter a valid test rate.'); return; }
    setSaving(true);
    const response = await fetch('/api/tests', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: String(form.get('name') || ''), category: String(form.get('category') || ''), ratePaise, referenceRange: String(form.get('referenceRange') || '') }) });
    const data = await response.json().catch(() => ({})) as { test?: TestDefinition; error?: string };
    setSaving(false);
    if (!response.ok || !data.test) { notify(data.error || 'Unable to add this test.'); return; }
    setTests((current) => [...current, data.test!].sort((a, b) => `${a.category}-${a.name}`.localeCompare(`${b.category}-${b.name}`)));
    formElement.reset(); notify('Test and rate were saved for this location only.');
  };
  const updateTest = (updated: TestDefinition) => setTests((current) => current.map((test) => test.id === updated.id ? updated : test).sort((a, b) => `${a.category}-${a.name}`.localeCompare(`${b.category}-${b.name}`)));
  return <><div className="page-heading"><div><p className="eyebrow">Location test catalogue</p><h1>Tests and rates</h1><p className="muted-copy">Only <strong>{location.name}</strong> can view or edit this catalogue and its rates.</p></div><div className="location-lock-small"><CircleDollarSign size={16} />{tests.length} active tests</div></div><div className="catalogue-layout"><section className="panel add-test-panel"><div className="panel-heading"><div><h2>Add a laboratory test</h2><p>Create a test with the standard rate for this dispensary.</p></div></div><form className="test-form" onSubmit={addTest}><label className="field">Test name *<Input name="name" required maxLength={80} placeholder="e.g. Vitamin D" /></label><label className="field">Category<Input name="category" maxLength={40} placeholder="e.g. Biochemistry" /></label><label className="field">Standard rate (₹) *<Input name="rate" required type="number" min="0" step="0.01" placeholder="0.00" /></label><label className="field">Reference range / notes<Input name="referenceRange" maxLength={160} placeholder="Optional, e.g. 12–16 g/dL" /></label><Button type="submit" disabled={saving}><Plus />{saving ? 'Adding test…' : 'Add test and rate'}</Button></form></section><section className="panel catalogue-list-panel"><div className="panel-heading"><div><h2>Available at this location</h2><p>Editing a standard rate never changes a price already saved on a patient entry.</p></div><span className="review-location"><MapPin size={14} />{location.short}</span></div><div className="catalogue-list">{tests.length ? tests.map((test) => <EditableTest key={test.id} test={test} onUpdate={updateTest} notify={notify} />) : <div className="empty-catalogue"><FlaskConical /><strong>Your catalogue is empty.</strong><span>Use the form to add the first test offered by this dispensary.</span></div>}</div></section></div></>;
}

function EditableTest({ test, onUpdate, notify }: { test: TestDefinition; onUpdate: (test: TestDefinition) => void; notify: (message: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ratePaise = paiseFromInput(form.get('rate'));
    if (ratePaise === null) { notify('Enter a valid test rate.'); return; }
    setSaving(true);
    const response = await fetch('/api/tests', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: test.id, name: String(form.get('name') || ''), category: String(form.get('category') || ''), ratePaise, referenceRange: String(form.get('referenceRange') || '') }) });
    const data = await response.json().catch(() => ({})) as { test?: TestDefinition; error?: string };
    setSaving(false);
    if (!response.ok || !data.test) { notify(data.error || 'Unable to update this test.'); return; }
    onUpdate(data.test); setEditing(false); notify('Test details and standard rate updated.');
  };
  return <article className={`catalogue-item ${editing ? 'editing' : ''}`}>{editing ? <form onSubmit={save} className="catalogue-edit"><label>Test name<Input name="name" required defaultValue={test.name} /></label><label>Category<Input name="category" defaultValue={test.category} /></label><label>Rate (₹)<Input name="rate" required type="number" min="0" step="0.01" defaultValue={(test.ratePaise / 100).toFixed(2)} /></label><label>Reference range<Input name="referenceRange" defaultValue={test.referenceRange} /></label><div><Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit" size="sm" disabled={saving}><Save />{saving ? 'Saving…' : 'Save'}</Button></div></form> : <><div className="catalogue-test-main"><span>{test.category}</span><strong>{test.name}</strong>{test.referenceRange && <small>{test.referenceRange}</small>}</div><div className="catalogue-rate"><strong>{money(test.ratePaise)}</strong><span>standard rate</span></div><Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}><Pencil /> Edit</Button></>}</article>;
}

function ResultEntry({ location, entries, notify, refresh }: { location: Branch; entries: TestEntry[]; notify: (message: string) => void; refresh: () => void }) {
  const [entryId, setEntryId] = useState('');
  const [detail, setDetail] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!entryId) return;
    let current = true;
    setLoading(true);
    fetch(`/api/results?entryId=${encodeURIComponent(entryId)}`).then(async (response) => {
      const data = await response.json().catch(() => ({})) as ResultDetail & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Unable to load this entry.');
      if (current) setDetail({ entry: data.entry, results: data.results });
    }).catch((error: Error) => { if (current) { setDetail(null); notify(error.message); } }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [entryId, notify]);
  const updateResult = (id: number, field: keyof Pick<TestResult, 'resultValue' | 'resultNote' | 'resultStatus'>, value: string) => setDetail((current) => current ? { ...current, results: current.results.map((result) => result.id === id ? { ...result, [field]: value } : result) } : current);
  const saveResults = async () => {
    if (!detail) return;
    setSaving(true);
    const response = await fetch('/api/results', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ entryId: detail.entry.recordId, results: detail.results.map(({ id, resultValue, resultNote, resultStatus }) => ({ id, resultValue, resultNote, resultStatus })) }) });
    const data = await response.json().catch(() => ({})) as { results?: TestResult[]; status?: TestEntry['status']; error?: string };
    setSaving(false);
    if (!response.ok || !data.results || !data.status) { notify(data.error || 'Unable to save these results.'); return; }
    setDetail((current) => current ? { entry: { ...current.entry, status: data.status! }, results: data.results! } : current);
    refresh(); notify('Result entry was saved for this location only.');
  };
  return <><div className="page-heading"><div><p className="eyebrow">Laboratory reporting</p><h1>Result entry</h1><p className="muted-copy">Select a patient registered at <strong>{location.name}</strong>, then enter and save the test results.</p></div><div className="location-lock-small"><ShieldCheck size={16} />{location.short} only</div></div><section className="panel result-picker"><label className="field">Choose a test entry<select value={entryId} onChange={(event) => { setEntryId(event.target.value); setDetail(null); }}><option value="">Select patient / report number</option>{entries.map((entry) => <option key={entry.recordId} value={entry.recordId}>{entry.id} · {entry.patient} · {entry.ip}</option>)}</select></label><p><ShieldCheck size={15} /> Other location records are not listed or accessible.</p></section>{loading && <section className="panel result-loading">Loading this location’s test entry…</section>}{detail && <section className="panel result-entry-panel"><div className="result-entry-heading"><div><span>{detail.entry.id}</span><h2>{detail.entry.patient}</h2><p>{detail.entry.ip} · {detail.entry.age} yrs · {detail.entry.sex}</p></div><span className={`status status-${detail.entry.status.replace(' ', '-').toLowerCase()}`}>{detail.entry.status}</span></div>{detail.results.length ? <><div className="result-table"><div className="result-table-head"><span>Test / saved rate</span><span>Result value</span><span>Remarks</span><span>Status</span></div>{detail.results.map((result) => <div className="result-row" key={result.id}><div><strong>{result.testName}</strong><small>{money(result.ratePaise)} saved on this entry</small></div><Input value={result.resultValue} maxLength={120} onChange={(event) => updateResult(result.id, 'resultValue', event.target.value)} placeholder="Enter value" /><Input value={result.resultNote} maxLength={240} onChange={(event) => updateResult(result.id, 'resultNote', event.target.value)} placeholder="Optional note" /><select value={result.resultStatus} onChange={(event) => updateResult(result.id, 'resultStatus', event.target.value)}><option>Pending</option><option>In progress</option><option>Completed</option></select></div>)}</div><div className="result-actions"><p>When every test is marked completed, the report moves to Completed automatically.</p><Button onClick={saveResults} disabled={saving}><Save />{saving ? 'Saving results…' : 'Save result entry'}</Button></div></> : <div className="empty-catalogue"><ClipboardList /><strong>This older entry has no editable result rows.</strong><span>Create a new test entry to use the result-entry workflow.</span></div>}</section>}</>;
}

function Reviews({ location, reviews, onAdd, notify }: { location: Branch; reviews: CustomerReview[]; onAdd: (review: CustomerReview) => void; notify: (message: string) => void }) {
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const reviewerName = String(form.get('reviewerName') || '').trim();
    const message = String(form.get('message') || '').trim();
    if (!message) { notify('Please write the customer review before saving.'); return; }
    setSaving(true);
    const response = await fetch('/api/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reviewerName, message, rating }) });
    const data = await response.json().catch(() => ({})) as { review?: CustomerReview; error?: string };
    setSaving(false);
    if (!response.ok || !data.review) { notify(data.error || 'Unable to save this review.'); return; }
    onAdd(data.review); formElement.reset(); setRating(5); notify('Customer review was saved to this location only.');
  };
  const average = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : '—';
  return <><div className="page-heading"><div><p className="eyebrow">Location feedback register</p><h1>Customer reviews</h1><p className="muted-copy">Reviews for <strong>{location.name}</strong> are stored separately from every other branch.</p></div><div className="review-average"><Star size={16} fill="currentColor" /> {average} <span>({reviews.length})</span></div></div>
    <div className="reviews-layout"><section className="panel review-form-panel"><div className="panel-heading"><div><h2>Add a customer review</h2><p>Record feedback received at this dispensary</p></div></div><form onSubmit={submitReview} className="review-form"><label className="field">Customer name <Input name="reviewerName" placeholder="Optional" /></label><div className="field"><span>Rating</span><div className="rating-picker" aria-label="Choose rating from 1 to 5">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} onClick={() => setRating(value)} aria-label={`${value} star${value > 1 ? 's' : ''}`} className={value <= rating ? 'selected' : ''}><Star fill="currentColor" /></button>)}</div></div><label className="field">Review *<textarea name="message" rows={5} placeholder="Write the customer’s feedback" maxLength={500} /></label><Button type="submit" disabled={saving}><MessageSquare />{saving ? 'Saving review…' : 'Save review'}</Button></form></section>
      <section className="panel reviews-list-panel"><div className="panel-heading"><div><h2>Recent feedback</h2><p>Visible only to this signed-in location</p></div><span className="review-location"><MapPin size={14} />{location.short}</span></div><div className="review-list">{reviews.length ? reviews.map((review) => <article className="review-item" key={review.id}><div className="review-item-top"><strong>{review.reviewerName}</strong><span>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={index < review.rating ? 'currentColor' : 'none'} />)}</span></div><p>{review.message}</p><small>{review.date}</small></article>) : <div className="empty-reviews"><MessageSquare /><strong>No reviews yet</strong><span>Feedback saved here will stay with {label(location)}.</span></div>}</div></section></div></>;
}

function Reports({ location, entries, query, setQuery, preview, setPreview }: { location: Branch; entries: TestEntry[]; query: string; setQuery: (value: string) => void; preview: TestEntry | null; setPreview: (entry: TestEntry | null) => void }) {
  const ready = entries.filter((entry) => entry.status === 'Completed');
  return <><div className="page-heading"><div><p className="eyebrow">Location-specific register</p><h1>Reports</h1><p className="muted-copy">Showing reports created at <strong>{location.name}</strong> only.</p></div><Button variant="outline" onClick={() => window.print()}><Printer /> Print register</Button></div><Tabs defaultValue="register" className="report-tabs"><TabsList variant="line"><TabsTrigger value="register"><ClipboardList /> Test register</TabsTrigger><TabsTrigger value="ready"><CheckCircle2 /> Completed reports</TabsTrigger></TabsList><TabsContent value="register"><ReportTable entries={entries} query={query} setQuery={setQuery} select={setPreview} /></TabsContent><TabsContent value="ready"><ReportTable entries={ready} query="" setQuery={() => undefined} select={setPreview} /></TabsContent></Tabs>{preview && <Preview entry={preview} location={location} close={() => setPreview(null)} />}</>;
}
function ReportTable({ entries, query, setQuery, select }: { entries: TestEntry[]; query: string; setQuery: (value: string) => void; select: (entry: TestEntry) => void }) { return <section className="panel reports-panel"><div className="reports-toolbar"><div className="report-count"><strong>{entries.length}</strong> entries at this location</div>{query !== undefined && <div className="search-field"><Search size={17} /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patient, IP or report no." /></div>}</div><EntryTable entries={entries} select={select} /></section>; }
function EntryTable({ entries, select }: { entries: TestEntry[]; select: (entry: TestEntry) => void }) { return <Table className="entry-table"><TableHeader><TableRow><TableHead>Report no.</TableHead><TableHead>Patient</TableHead><TableHead>Tests</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{entries.length ? entries.map((entry) => <TableRow key={entry.id}><TableCell><strong className="report-id">{entry.id}</strong><small>{entry.date}</small></TableCell><TableCell><strong>{entry.patient}</strong><small>{entry.patientId} · {entry.age} yrs · {entry.sex}</small></TableCell><TableCell><div className="test-tags">{entry.tests.slice(0, 2).map((test) => <span key={test}>{test}</span>)}{entry.tests.length > 2 && <span>+{entry.tests.length - 2}</span>}</div></TableCell><TableCell><span className={`status status-${entry.status.replace(' ', '-').toLowerCase()}`}>{entry.status}</span></TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => select(entry)}>View <ChevronRight /></Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={5}><div className="empty-table"><FileText /><strong>No reports found</strong><span>Try a different patient or report number.</span></div></TableCell></TableRow>}</TableBody></Table>; }
function Preview({ entry, location, close }: { entry: TestEntry; location: Branch; close: () => void }) {
  const [results, setResults] = useState<TestResult[]>([]);
  useEffect(() => {
    let current = true;
    fetch(`/api/results?entryId=${entry.recordId}`).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json() as { results: TestResult[] };
      if (current) setResults(data.results || []);
    }).catch(() => undefined);
    return () => { current = false; };
  }, [entry.recordId]);
  const reportRows = results.length ? results.map((result) => ({ name: result.testName, value: result.resultValue || (result.resultStatus === 'Completed' ? 'Result verified' : 'Awaiting laboratory verification'), status: result.resultStatus })) : entry.tests.map((test) => ({ name: test, value: entry.status === 'Completed' ? 'Result verified' : 'Awaiting laboratory verification', status: entry.status }));
  const printSelectedReport = () => {
    document.body.classList.add('printing-selected-report');
    window.addEventListener('afterprint', () => document.body.classList.remove('printing-selected-report'), { once: true });
    window.print();
  };
  return <div className="report-drawer-backdrop" role="presentation"><aside className="report-drawer" role="dialog" aria-modal="true" aria-label="Report preview"><div className="drawer-header"><div><p className="eyebrow">Report preview</p><h2>{entry.id}</h2></div><Button variant="ghost" size="icon" onClick={close} aria-label="Close report"><X /></Button></div><div className="report-paper"><div className="report-logo-line"><img src="/up-esis-logo.jpeg" alt="" /><div><strong>ESIC DISPENSARIES, LUCKNOW ZONE</strong><span>{location.name}</span></div></div><div className="report-title">LABORATORY INVESTIGATION REPORT</div><div className="patient-strip"><div><span>Patient name</span><strong>{entry.patient}</strong></div><div><span>Patient ID</span><strong>{entry.patientId}</strong></div><div><span>Age / Sex</span><strong>{entry.age} / {entry.sex}</strong></div><div><span>IP number</span><strong>{entry.ip}</strong></div><div><span>Relationship with IP</span><strong>{entry.relationship}</strong></div><div><span>IP holder / related person</span><strong>{entry.ipHolderName || '—'}</strong></div></div><div className="result-list">{reportRows.map((result) => <div key={result.name}><strong>{result.name}</strong><span>{result.value}</span></div>)}</div><div className="report-sign"><div className="signature-block"><span className="signature-line" /><strong>Signature of Lab Technician</strong></div><div className="signature-block"><span className="signature-line" /><strong>Signature of MOI / CMO</strong></div></div><p className="report-footnote">This is a demonstration layout. Clinical values and authorisation must be validated by the authorised laboratory before issue.</p></div><div className="drawer-actions"><Button variant="outline" onClick={close}>Close</Button><Button onClick={printSelectedReport}><Printer /> Print report</Button></div></aside></div>;
}
