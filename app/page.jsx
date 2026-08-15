'use client';

import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  supabase,
  isSupabaseConfigured,
  isAdminEmail
} from '../lib/supabaseClient';

const clubName = process.env.NEXT_PUBLIC_CLUB_NAME || 'Taprobana Sports Club';

const launchEvent =
  process.env.NEXT_PUBLIC_LAUNCH_EVENT ||
  'Annual Gathering & Appreciation Night 2026';

const defaultAnnouncements = [
  {
    id: 'a1',
    title: 'Digital Platform Launch',
    body: 'Welcome to the official digital home of Taprobana Sports Club.',
    category: 'Launch',
    created_at: new Date().toISOString()
  },
  {
    id: 'a2',
    title: 'Founding Digital Member Badge',
    body: 'Members joining during launch will carry the Founding Digital Member badge.',
    category: 'Membership',
    created_at: new Date().toISOString()
  }
];

const defaultEvents = [
  {
    id: 'e1',
    title: 'Annual Gathering & Appreciation Night',
    event_date: '2026-08-15',
    location: 'Dubai',
    status: 'Open'
  },
  {
    id: 'e2',
    title: 'Taprobana Cricket Challenge',
    event_date: '2026-09-01',
    location: 'UAE',
    status: 'Coming Soon'
  }
];

const videos = [
  {
    id: 'rFqM4aJ9Oww',
    title: 'Division 1 Champions Final Highlights'
  },
  {
    id: '3CyoUkxS1hk',
    title: 'Player Performance Highlights'
  },
  {
    id: 'ixEvpQ75x1A',
    title: 'Division 4 Champions Journey'
  },
  {
    id: 'LKdtp5FMLyk',
    title: 'Taprobana Cricket Club Legacy'
  },
  {
    id: 'u7cx0ourLfA',
    title: 'Super 12 Decider Highlights'
  },
  {
    id: '3ZVwarpkiUI',
    title: 'Division 2 Semi Final Highlights'
  },
  {
    id: 'nh1ix-6HNDc',
    title: 'Division 2 Final Highlights'
  }
];

function membershipNumber(profile, user) {
  const source = profile?.membership_no || user?.id || '000001';
  const suffix = source
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase()
    .padEnd(6, '0');

  return profile?.membership_no || `TCC-2026-${suffix}`;
}

function LoadingBadge({ children }) {
  return <span className="pill loading-pill">{children}</span>;
}

function VideoTile({ id, title }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,.035)',
        border: '1px solid rgba(246,211,107,.18)',
        borderRadius: '18px',
        padding: '10px'
      }}
    >
      <iframe
        width="100%"
        height="220"
        src={`https://www.youtube.com/embed/${id}`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading function Home() {
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
  const [sessionWarning, setSessionWarning] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    profession: '',
    company: '',
    password: '',
    confirm: ''
  });

  const [adminForm, setAdminForm] = useState({
    title: '',
    body: '',
    category: 'Notice',
    eventTitle: '',
    eventDate: '',
    eventLocation: ''
  });

  const admin = useMemo(
    () => isAdminEmail(user?.email) || profile?.role === 'admin',
    [user, profile]
  );

  const memberNo = membershipNumber(profile, user);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.search.includes('live=1')
    ) {
      setStage('live');
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setUser(data.session.user);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);

        if (!session?.user) {
          setProfile(null);
        }
      }
    );

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

      warningTimer = setTimeout(() => {
        setSessionWarning(true);
      }, 14 * 60 * 1000);

      logoutTimer = setTimeout(() => {
        signOut();
      }, 15 * 60 * 1000);
    };

    ['mousemove', 'keydown', 'click', 'touchstart'].forEach((eventName) =>
      window.addEventListener(eventName, reset)
    );

    reset();

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);

      ['mousemove', 'keydown', 'click', 'touchstart'].forEach((eventName) =>
        window.removeEventListener(eventName, reset)
      );
    };
  }, [user]);

  async function loadProfileAndContent(currentUser) {
    if (!supabase) return;

    const { data: foundProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (foundProfile) {
      setProfile(foundProfile);
    }

    const { data: news } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (news?.length) {
      setAnnouncements(news);
    }

    const { data: upcoming } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })
      .limit(10);

    if (upcoming?.length) {
      setEvents(upcoming);
    }
  }

  function startLaunch() {
    setStage('countdown');
    setCount(10);

    const timer = setInterval(() => {
      setCount((value) => {
        if (value <= 1) {
          clearInterval(timer);
          setStage('reveal');

          setTimeout(() => {
            setStage('live');
          }, 2300);

          return 0;
        }

        return value - 1;
      });
    }, 1000);
  }

  async function signUp() {
    setMessage('');

    if (!form.name || !form.email || !form.password) {
      return setMessage('Please enter name, email and password.');
    }

    if (form.password !== form.confirm) {
      return setMessage('Passwords do not match.');
    }

    if (!isSupabaseConfigured || !supabase) {
      const demoUser = {
        id: crypto.randomUUID(),
        email: form.email
      };

      const demoProfile = {
        id: demoUser.id,
        full_name: form.name,
        phone: form.phone,
        profession: form.profession,
        company: form.company,
        role: 'member',
        status: 'active',
        founding_member: true
      };

      setUser(demoUser);
      setProfile(demoProfile);
      setView('dashboard');

      return setMessage(
        'Demo mode active. Add Supabase environment variables in Vercel to store real member accounts.'
      );
    }

    setBusy(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          phone: form.phone,
          profession: form.profession,
          company: form.company
        }
      }
   
