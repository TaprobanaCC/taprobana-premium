'use client';

import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase, isSupabaseConfigured, isAdminEmail } from '../lib/supabaseClient';

const clubName = process.env.NEXT_PUBLIC_CLUB_NAME || 'Taprobana Sports Club';
const launchEvent = process.env.NEXT_PUBLIC_LAUNCH_EVENT || 'Annual Gathering & Appreciation Night 2026';

const defaultAnnouncements = [
  { id: 'a1', title: 'Digital Platform Launch', body: 'Welcome to the official digital home of Taprobana Sports Club.', category: 'Launch', created_at: new Date().toISOString() },
  { id: 'a2', title: 'Founding Digital Member Badge', body: 'Members joining during launch will carry the Founding Digital Member badge.', category: 'Membership', created_at: new Date().toISOString() }
];

const defaultEvents = [
  { id: 'e1', title: 'Annual Gathering & Appreciation Night', event_date: '2026-08-15', location: 'Dubai', status: 'Open' },
  { id: 'e2', title: 'Taprobana Cricket Challenge', event_date: '2026-09-01', location: 'UAE', status: 'Coming Soon' }
];

function membershipNumber(profile, user) {
  const source = profile?.membership_no || user?.id || '000001';
  const suffix = source.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase().padEnd(6, '0');
  return profile?.membership_no || `TCC-2026-${suffix}`;
}

function LoadingBadge({ children }) {
  return <span className="pill loading-pill">{children}</span>;
}

export default function Home() {
  const [stage, setStage] = useState('prelaunch');
  const [count, setCount] = useState(10);
  const [view, setView] = useState('home');
  const [mode, setMode] = useState('login');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [announcements, setAnnouncements] = useState(defaultAnnouncements);
  const [events, setEvents] = useState(defaultEvents);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', profession: '', company: '', password: '', confirm: '' });
  const [adminForm, setAdminForm] = useState({ title: '', body: '', category: 'Notice', eventTitle: '', eventDate: '', eventLocation: '' });
  const [sessionWarning, setSessionWarning] = useState(false);

  const admin = useMemo(() => isAdminEmail(user?.email) || profile?.role === 'admin', [user, profile]);
  const memberNo = membershipNumber(profile, user);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('live=1')) {
      setStage('live');
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) setUser(data.session.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) setProfile(null);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) return;
    loadProfileAndContent(user);
  }, [user]);

  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) return;
    let warningTimer;
    let logoutTimer;
    const reset = () => {
      setSessionWarning(false);
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      warningTimer = setTimeout(() => setSessionWarning(true), 14 * 60 * 1000);
      logoutTimer = setTimeout(() => signOut(), 15 * 60 * 1000);
    };
    ['mousemove', 'keydown', 'click', 'touchstart'].forEach((eventName) => window.addEventListener(eventName, reset));
    reset();
    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      ['mousemove', 'keydown', 'click', 'touchstart'].forEach((eventName) => window.removeEventListener(eventName, reset));
    };
  }, [user]);

  async function loadProfileAndContent(currentUser) {
    if (!supabase) return;
    const { data: foundProfile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    if (foundProfile) setProfile(foundProfile);
    const { data: news } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(10);
    if (news?.length) setAnnouncements(news);
    const { data: upcoming } = await supabase.from('events').select('*').order('event_date', { ascending: true }).limit(10);
    if (upcoming?.length) setEvents(upcoming);
  }

  function startLaunch() {
    setStage('countdown');
    setCount(10);
    const timer = setInterval(() => {
      setCount((value) => {
        if (value <= 1) {
          clearInterval(timer);
          setStage('reveal');
          setTimeout(() => setStage('live'), 2300);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }

  async function signUp() {
    setMessage('');
    if (!form.name || !form.email || !form.password) return setMessage('Please enter name, email and password.');
    if (form.password !== form.confirm) return setMessage('Passwords do not match.');
    if (!isSupabaseConfigured || !supabase) {
      const demoUser = { id: crypto.randomUUID(), email: form.email };
      const demoProfile = { id: demoUser.id, full_name: form.name, phone: form.phone, profession: form.profession, company: form.company, role: 'member', status: 'active', founding_member: true };
      setUser(demoUser);
      setProfile(demoProfile);
      setView('dashboard');
      return setMessage('Demo mode active. Add Supabase environment variables in Vercel to store real member accounts.');
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, phone: form.phone, profession: form.profession, company: form.company } }
    });
    setBusy(false);
    if (error) return setMessage(error.message);
    if (data?.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: form.email,
        full_name: form.name,
        phone: form.phone,
        profession: form.profession,
        company: form.company,
        role: isAdminEmail(form.email) ? 'admin' : 'member',
        status: 'active',
        founding_member: true,
        membership_no: `TCC-2026-${data.user.id.slice(0, 6).toUpperCase()}`
      });
      setMessage('Account created. If email confirmation is enabled, verify your email, then log in.');
      setMode('login');
    }
  }

  async function login() {
    setMessage('');
    if (!form.email || !form.password) return setMessage('Please enter email and password.');
    if (!isSupabaseConfigured || !supabase) {
      const demoUser = { id: crypto.randomUUID(), email: form.email };
      setUser(demoUser);
      setProfile({ id: demoUser.id, email: form.email, full_name: form.name || 'Founding Member', role: isAdminEmail(form.email) ? 'admin' : 'member', status: 'active', founding_member: true });
      setView('dashboard');
      return setMessage('Demo mode active. Supabase is not connected yet.');
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setBusy(false);
    if (error) return setMessage(error.message);
    setUser(data.user);
    setView('dashboard');
  }

  async function signOut() {
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setView('home');
    setMessage('Signed out successfully.');
  }

  async function updateProfile() {
    if (!user) return;
    const updated = { ...profile, full_name: form.name || profile?.full_name, phone: form.phone || profile?.phone, profession: form.profession || profile?.profession, company: form.company || profile?.company };
    setProfile(updated);
    if (isSupabaseConfigured && supabase) await supabase.from('profiles').upsert({ id: user.id, email: user.email, ...updated });
    setMessage('Profile updated.');
  }

  async function addAnnouncement() {
    const item = { title: adminForm.title, body: adminForm.body, category: adminForm.category || 'Notice' };
    if (!item.title || !item.body) return setMessage('Add title and body for the announcement.');
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('announcements').insert(item).select().single();
      if (error) return setMessage(error.message);
      setAnnouncements([data, ...announcements]);
    } else {
      setAnnouncements([{ ...item, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...announcements]);
    }
    setAdminForm({ ...adminForm, title: '', body: '' });
    setMessage('Announcement added.');
  }

  async function addEvent() {
    const item = { title: adminForm.eventTitle, event_date: adminForm.eventDate, location: adminForm.eventLocation, status: 'Open' };
    if (!item.title || !item.event_date) return setMessage('Add event title and date.');
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('events').insert(item).select().single();
      if (error) return setMessage(error.message);
      setEvents([...events, data]);
    } else {
      setEvents([...events, { ...item, id: crypto.randomUUID() }]);
    }
    setAdminForm({ ...adminForm, eventTitle: '', eventDate: '', eventLocation: '' });
    setMessage('Event added.');
  }

  if (stage === 'prelaunch') {
    return (
      <main className="launch-screen">
        <div className="stadium-glow" />
        <div className="grain" />
        <section className="hero-card prelaunch-card">
          <span className="eyebrow">Official Digital Platform</span>
          <h1>{clubName}</h1>
          <h2>Since 2013</h2>
          <p>{launchEvent}</p>
          <button className="gold-button large" onClick={startLaunch}>Start Live Launch</button>
          <button className="ghost-button" onClick={() => setStage('live')}>Skip to Website</button>
        </section>
      </main>
    );
  }

  if (stage === 'countdown') {
    return (
      <main className="countdown-screen">
        <div className="pulse-ring" />
        <p>We Are Going Live In</p>
        <strong>{count}</strong>
        <span>Initialising Taprobana Digital Platform</span>
      </main>
    );
  }

  if (stage === 'reveal') {
    return (
      <main className="reveal-screen">
        <div className="logo-mark">T</div>
        <h1>Welcome To The Official Digital Home</h1>
        <p>{clubName}</p>
      </main>
    );
  }

  return (
    <main className="site-shell">
      <nav className="topbar">
        <div className="brand"><span className="mini-logo">T</span><div><strong>{clubName}</strong><small>Premium Member Platform</small></div></div>
        <div className="nav-actions">
          <button onClick={() => setView('home')}>Home</button>
          <button onClick={() => setView('visitor')}>Visitor Pavilion</button>
          <button onClick={() => setView(user ? 'dashboard' : 'auth')}>Member Pavilion</button>
          {admin && <button onClick={() => setView('admin')}>Admin</button>}
          {user && <button className="danger" onClick={signOut}>Sign Out</button>}
        </div>
      </nav>

      {message && <div className="message-bar">{message}</div>}
      {sessionWarning && <div className="warning-bar">Your secure session is inactive. Move or click to continue.</div>}

      {view === 'home' && (
        <section className="home-grid">
          <div className="hero-panel">
            <span className="eyebrow">Launched for the Sri Lankan sporting community in the UAE</span>
            <h1>Taprobana Digital Platform</h1>
            <p>A premium digital club experience with member profiles, digital cards, news, events, learning hub previews and committee-controlled content.</p>
            <div className="hero-actions"><button className="gold-button" onClick={() => setView('auth')}>Create Member Account</button><button className="ghost-button" onClick={() => setView('visitor')}>Explore Visitor Pavilion</button></div>
          </div>
          <div className="split-card visitor-card" onClick={() => setView('visitor')}><h2>Visitor Pavilion</h2><p>About us, achievements, gallery, sponsors and public highlights.</p></div>
          <div className="split-card member-card" onClick={() => setView(user ? 'dashboard' : 'auth')}><h2>Member Pavilion</h2><p>Secure access for founding digital members and club community features.</p></div>
        </section>
      )}

      {view === 'visitor' && (
        <section className="content-section">
          <h1>Visitor Pavilion</h1>

          <div className="cards-grid">
            <article className="feature-card">
              <img
                src="/images/supun.jpg"
                alt="About Taprobana"
                style={{
                  width: "100%",
                  borderRadius: "16px"

              <h3>About Taprobana</h3>

              <p>
                Founded in 2013, Taprobana Sports Club has grown into one of the
                most active Sri Lankan sporting communities in the UAE. Built on
                friendship, sportsmanship and community values, the club continues
                to unite members through sport, social events and community
                engagement.
              </p>
            </article>

            <article className="feature-card">
              <h3>Since 2013</h3>

              <p>
                For more than a decade, Taprobana Sports Club has created
                opportunities for friendship, sporting excellence, leadership and
                community development among Sri Lankans living in the United Arab
                Emirates.
              </p>
            </article>

            <article className="feature-card">
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  marginBottom: "16px"
                }}
              ><div
            style={{
              display: "grid",
              gap: "12px",
              marginBottom: "16px"
            }}
          >
            <images/cricket-legacy.jpg
          
            <img
              src="/images/badminton-legacy.jpg
              </div>

              <h3>Our Victories</h3>

              <p>
                Through cricket, badminton and community events, Taprobana Sports
                Club has built a proud legacy of championships, achievements and
                unforgettable moments.
              </p>
            </article>

            <article className="feature-card">
              <h3>Hall of Fame</h3>

              <p>
                Recognising the players, volunteers, committee members, sponsors
                and supporters who shaped the success story of Taprobana Sports
                Club.
              </p>
            </article>

            <article className="feature-card">
              <h3>Gallery</h3>

              <p>
                Explore our journey through photographs and memories from
                tournaments, annual gatherings, family events and club milestones.
              </p>
            </article>

            <article className="feature-card">
              <h3>Sponsors</h3>

              <p>
                We proudly acknowledge the generous sponsors and partners whose
                support continues to strengthen our community initiatives.
              </p>
            </article>

            <article className="feature-card">
              <h3>Contact Committee</h3>

              <p>
                Connect with the Taprobana committee for membership inquiries,
                partnerships, events, volunteering and community initiatives.
              </p>
            </article>

            <article className="feature-card">
              <h3>Event Highlights</h3>

              <p>
                Stay connected with our tournaments, annual gatherings, corporate
                matches, member activities and community celebrations.
              </p>
            </article>
          </div>
        </section>
      )}

      {view === 'auth' && (
        <section className="auth-wrap">
          <div className="auth-card">
            <h1>{mode === 'login' ? 'Member Login' : 'Create Founding Member Account'}</h1>
            <p>Register during launch and enter the Taprobana Member Pavilion.</p>

            {mode === 'signup' && (
              <input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}

            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            {mode === 'signup' && (
              <input
                placeholder="Mobile"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            )}

            {mode === 'signup' && (
              <input
                placeholder="Profession"
                value={form.profession}
                onChange={(e) => setForm({ ...form, profession: e.target.value })}
              />
            )}

            {mode === 'signup' && (
              <input
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            )}

            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            {mode === 'signup' && (
              <input
                placeholder="Confirm password"
                type="password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            )}

            <button
              className="gold-button full"
              disabled={busy}
              onClick={mode === 'login' ? login : signUp}
            >
              {busy ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>

            <button
              className="link-button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'New member? Create account' : 'Already registered? Login'}
            </button>

            {!isSupabaseConfigured && (
              <LoadingBadge>
                Demo mode: add Supabase env variables in Vercel for real accounts
              </LoadingBadge>
            )}
          </div>
        </section>
      )}
      {view === 'dashboard' && user && (
        <section className="dashboard">
          <header className="dashboard-hero">
            <div><span className="eyebrow">Member Pavilion</span><h1>Welcome, {profile?.full_name || user.email}</h1><p>Founding Digital Member dashboard for Taprobana Sports Club.</p></div>
            <div className="status-stack"><span className="status active">ACTIVE MEMBER</span><span className="status founding">FOUNDING DIGITAL MEMBER</span></div>
          </header>
          <div className="dashboard-grid">
            <article className="digital-card"><div><span>Taprobana Sports Club</span><h2>{profile?.full_name || user.email}</h2><p>{memberNo}</p><small>Status: Active</small></div><QRCodeSVG value={`${clubName}:${memberNo}:${user.email}`} size={96} bgColor="transparent" fgColor="#f6d36b" /></article>
            <article className="metric-card"><strong>03</strong><span>Events Attended</span></article>
            <article className="metric-card"><strong>00</strong><span>CPD Hours</span></article>
            <article className="metric-card"><strong>85%</strong><span>Profile Completion</span></article>
          </div>
          <div className="two-column">
            <section className="panel"><h2>Club News Centre</h2>{announcements.map((item) => <div className="list-item" key={item.id}><span>{item.category}</span><h3>{item.title}</h3><p>{item.body}</p></div>)}</section>
            <section className="panel"><h2>Upcoming Events</h2>{events.map((item) => <div className="list-item" key={item.id}><span>{item.status || 'Open'}</span><h3>{item.title}</h3><p>{item.event_date} {item.location ? `| ${item.location}` : ''}</p><button className="ghost-button small">I am attending</button></div>)}</section>
          </div>
          <section className="cards-grid compact">
            {['Digital Gallery', 'Learning Hub', 'Live Community', 'Welfare Hub', 'Business Directory', 'Job Board', 'CPD Certificates', 'Single Device Security'].map((title) => <article className="feature-card" key={title}><LoadingBadge>Coming Soon</LoadingBadge><h3>{title}</h3><p>Premium module preview for the Taprobana roadmap.</p></article>)}
          </section>
          <section className="panel profile-panel"><h2>Update Profile</h2><div className="form-grid"><input placeholder="Full name" onChange={(e) => setForm({ ...form, name: e.target.value })} /><input placeholder="Mobile" onChange={(e) => setForm({ ...form, phone: e.target.value })} /><input placeholder="Profession" onChange={(e) => setForm({ ...form, profession: e.target.value })} /><input placeholder="Company" onChange={(e) => setForm({ ...form, company: e.target.value })} /></div><button className="gold-button" onClick={updateProfile}>Save Profile</button></section>
        </section>
      )}

      {view === 'admin' && admin && (
        <section className="admin-section">
          <h1>Committee Admin Panel</h1>
          <p>Use this launch-ready panel to add visible notices and events. With Supabase configured, records are saved to the database.</p>
          <div className="two-column">
            <section className="panel"><h2>Add Announcement</h2><input placeholder="Title" value={adminForm.title} onChange={(e) => setAdminForm({ ...adminForm, title: e.target.value })} /><input placeholder="Category" value={adminForm.category} onChange={(e) => setAdminForm({ ...adminForm, category: e.target.value })} /><textarea placeholder="Message" value={adminForm.body} onChange={(e) => setAdminForm({ ...adminForm, body: e.target.value })} /><button className="gold-button" onClick={addAnnouncement}>Publish Notice</button></section>
            <section className="panel"><h2>Add Event</h2><input placeholder="Event title" value={adminForm.eventTitle} onChange={(e) => setAdminForm({ ...adminForm, eventTitle: e.target.value })} /><input type="date" value={adminForm.eventDate} onChange={(e) => setAdminForm({ ...adminForm, eventDate: e.target.value })} /><input placeholder="Location" value={adminForm.eventLocation} onChange={(e) => setAdminForm({ ...adminForm, eventLocation: e.target.value })} /><button className="gold-button" onClick={addEvent}>Add Event</button></section>
          </div>
        </section>
      )}
    </main>
  );
}
