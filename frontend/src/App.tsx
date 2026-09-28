import { useEffect, useMemo, useRef, useState, useCallback, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Bell, Bookmark, BookOpen, CalendarDays, Check, CheckCircle2, ChevronRight, CircleHelp, ClipboardList, FileText, Home as HomeIcon, Lightbulb, LogOut, Menu, MessageCircle, Plus, Search, Send, ShieldCheck, Sparkles, UserRound, Users, X, ThumbsUp, ExternalLink } from 'lucide-react';
import './App.css';
import './fixes.css';
import './academic/academic.css';
import { subjects, initialQuestions, initialAnswers, initialTasks, resources as seedResources, notifications, people, groups, type Question, type Answer, type Task, type Resource } from './data';
import { authApi, req, PROGRAMS, type AuthUser } from './auth';
import { Toaster } from 'sonner';
import { AcademicProvider, useAcademic } from './academic/AcademicContext';
import { useLocal } from './academic/localStore';
import { colombiaTime, colombiaToday } from './academic/time';
import type { Member, AcademicEvent } from './academic/types';
import CoursesPage from './academic/CoursesPage';
import CourseDetail from './academic/CourseDetail';
import ChatsPage from './academic/ChatsPage';
import AssistantPage from './academic/AssistantPage';
import GroupPage from './academic/GroupPage';
import ActivityPage from './academic/ActivityPage';
import { DoubtsPage, NewDoubtPage, DoubtDetailPage } from './academic/DoubtsPages';
import FilesPage from './academic/FilesPage';
import SavedPage from './academic/SavedPage';
import SchedulesPage from './academic/SchedulesPage';
import SupportPeoplePage from './academic/SupportPeoplePage';
import ResourcesPage from './academic/ResourcesPage';

const nav = [{to:'/', label:'Inicio', icon:HomeIcon}, {to:'/asignaturas', label:'Asignaturas', icon:BookOpen}, {to:'/dudas', label:'Dudas', icon:CircleHelp}, {to:'/grupo', label:'Mi grupo', icon:Users}, {to:'/chats', label:'Chats', icon:MessageCircle}, {to:'/asistente', label:'Asistente IA', icon:Sparkles}, {to:'/rutas', label:'Rutas', icon:Lightbulb}];
const usePersist = <T,>(key:string, initial:T) => {const {user}=useAuth();return useLocal(key,initial,user?.user_id||'guest');};
const Icon = ({name}:{name:string}) => { const icons:any={BookOpen,CalendarDays,ClipboardList,FileText,MessageCircle,Users,Lightbulb,Search,Bell}; const C=icons[name]||Sparkles; return <C size={19}/>; };
const initials = (name?:string|null) => (name||'U').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();

// ---------- Auth Context ----------
type AuthCtx = { user: AuthUser|null; loading: boolean; refresh: ()=>Promise<void>; logout: ()=>Promise<void> };
const AuthContext = createContext<AuthCtx>({user:null,loading:true,refresh:async()=>{},logout:async()=>{}});
const useAuth = () => useContext(AuthContext);

function AuthProvider({children}:{children:React.ReactNode}){
  const [user,setUser]=useState<AuthUser|null>(null);
  const [loading,setLoading]=useState(true);
  const refresh = useCallback(async () => { try { const u = await authApi.me(); setUser(u); } catch { setUser(null); } },[]);
  useEffect(()=>{
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) { setLoading(false); return; }
    (async ()=>{ await refresh(); setLoading(false); })();
  },[refresh]);
  const logout = async () => { try { await authApi.logout(); } catch{} setUser(null); };
  return <AuthContext.Provider value={{user,loading,refresh,logout}}>{children}</AuthContext.Provider>;
}

// ---------- Login ----------
function Login(){
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const signIn = () => {
    if(window.location.pathname==='/asignaturas'&&window.location.search)sessionStorage.setItem('uao-after-login',window.location.pathname+window.location.search);
    const redirectUrl = window.location.origin + '/';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  return <div className="auth-shell">
    <div className="auth-card">
      <div className="brand" style={{padding:0,marginBottom:22}}><span className="brand-mark">U</span>UAO Conecta</div>
      <div className="eyebrow">ENCONTRAR · COORDINAR · SABER A QUIÉN ACUDIR</div>
      <h1>Tu espacio académico, en un solo lugar.</h1>
      <p>Inicia sesión con tu cuenta de Google para acceder a tus asignaturas, dudas, grupo y rutas de apoyo.</p>
      <button className="btn btn-dark auth-google" onClick={signIn} data-testid="google-signin-button">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.6 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 16.3 4.5 9.7 9 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5.1l-6.1-5c-1.9 1.3-4.3 2.1-7.1 2.1-5.3 0-9.7-3.1-11.3-7.4l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6.1 5c-.4.4 6.3-4.6 6.3-14.4 0-1.2-.1-2.3-.3-3.5z"/></svg>
        Continuar con Google
      </button>
      <div className="auth-note"><ShieldCheck size={14}/> No compartimos tus datos. Puedes elegir tu nombre visible al ingresar.</div>
    </div>
    <div className="auth-side">
      <div className="hero-side">
        <div className="eyebrow">DEMO ACADÉMICA</div>
        <h2>Encuentra respuestas, coordina con tu grupo y sabe a quién acudir.</h2>
        <ul>
          <li><Search size={16}/> Buscador global agrupado por dudas, personas, recursos, grupos y asignaturas.</li>
          <li><MessageCircle size={16}/> Publica dudas anónimas y marca soluciones.</li>
          <li><CalendarDays size={16}/> Encuentra horarios comunes de tu grupo.</li>
        </ul>
      </div>
    </div>
  </div>;
}

// ---------- Auth Callback ----------
function AuthCallback(){
  const location = useLocation();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const hasProcessed = useRef(false);
  const [error,setError] = useState('');
  useEffect(()=>{
    if (hasProcessed.current) return; hasProcessed.current = true;
    const hash = location.hash || '';
    const m = hash.match(/session_id=([^&]+)/);
    if (!m) { navigate('/', {replace:true}); return; }
    (async ()=>{
      try { await authApi.exchangeSession(decodeURIComponent(m[1])); await refresh(); const after=sessionStorage.getItem('uao-after-login');sessionStorage.removeItem('uao-after-login');const next=after?.startsWith('/asignaturas?join=')?after:'/';window.history.replaceState(null,'',next); navigate(next, {replace:true}); }
      catch(e:any){ setError(e.message || 'No pudimos iniciar sesión'); }
    })();
  },[location.hash,navigate,refresh]);
  return <div className="auth-shell"><div className="auth-card"><h1>Iniciando sesión…</h1><p className="muted">{error || 'Un momento, estamos validando tu cuenta.'}</p></div></div>;
}

// ---------- Onboarding (choose username) ----------
function Onboarding(){
  const { user, refresh } = useAuth();
  const [name,setName] = useState(user?.custom_username||'');
  const [program,setProgram] = useState(user?.program||'');
  const [role,setRole] = useState<AuthUser['role']>(user?.role||null);
  const [err,setErr] = useState('');
  const [busy,setBusy] = useState(false);
  const submit = async (e:React.FormEvent) => { e.preventDefault(); setErr('');
    if(!program||!role){ setErr('Selecciona tu programa de ingeniería y tu rol.'); return; }
    setBusy(true);
    try { await authApi.setUsername(name.trim(), program, role); await refresh(); } catch(ex:any){ setErr(ex.message); } finally { setBusy(false); }
  };
  return <div className="auth-shell"><div className="auth-card">
    <div className="eyebrow">BIENVENIDA A UAO CONECTA</div>
    <h1>¿Cómo quieres que te llamen?</h1>
    <p>Este es el nombre visible en tus dudas, respuestas y en tu grupo. Puedes cambiarlo después.</p>
    <form onSubmit={submit} className="form">
      <div className="field">
        <label htmlFor="username">Nombre visible</label>
        <input id="username" data-testid="username-input" autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder={`Ej. ${(user?.name||'Sofía').split(' ')[0]}`} minLength={2} maxLength={24} required/>
        <small className="muted">Entre 2 y 24 caracteres.</small>
      </div>
      <div className="field">
        <label htmlFor="program">Programa de ingeniería</label>
        <select id="program" data-testid="program-select" value={program} onChange={e=>setProgram(e.target.value)} required>
          <option value="" disabled>Selecciona tu programa…</option>
          {PROGRAMS.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="field"><label htmlFor="onboarding-role">Rol académico</label><select id="onboarding-role" data-testid="onboarding-role-select" value={role||''} onChange={e=>setRole(e.target.value as AuthUser['role'])} required><option value="" disabled>Selecciona tu rol…</option><option>Estudiante</option><option>Monitor</option><option>Profesor</option></select><small className="muted" data-testid="role-self-declared-notice">Rol autodeclarado, sin verificación institucional. No podrás cambiarlo desde el perfil.</small></div>
      {err && <div className="form-note" style={{background:'#fde8e8',color:'#a1272b'}} data-testid="onboarding-error">{err}</div>}
      <button className="btn btn-primary" type="submit" disabled={busy} data-testid="submit-username-button">{busy ? 'Guardando…' : 'Continuar'}</button>
    </form>
  </div></div>;
}

function Shell({children}:{children:React.ReactNode}) {
  const {events}=useAcademic();
  const [localEvents]=usePersist<AcademicEvent[]>('uao-events',[]);
  const unread=[...events,...localEvents].filter(n=>!n.read).length;
  const [mobileMenu,setMobileMenu]=useState(false);
  const [today,setToday]=useState(colombiaToday());
  const location=useLocation();
  useEffect(()=>{setMobileMenu(false);},[location.pathname,location.search]);
  useEffect(()=>{const timer=setInterval(()=>setToday(colombiaToday()),60000);return()=>clearInterval(timer);},[]);
  const { user, logout } = useAuth();
  const display = user?.custom_username || user?.name || 'Usuario';
  return <div className="shell">
    <aside className="sidebar">
      <Link className="brand" to="/" data-testid="sidebar-brand"><span className="brand-mark">U</span>UAO Conecta</Link>
      <div className="nav-label">Tu espacio académico</div>
      <nav className="nav-list">{nav.map(n=><NavLink key={n.to} to={n.to} end={n.to==='/'} className="nav-item" data-testid={`sidebar-${n.label.toLowerCase().replace(' ','-')}`}><n.icon size={18}/>{n.label}</NavLink>)}</nav>
      <div className="nav-label secondary">Tu información</div>
      <nav className="nav-list">
        <NavLink to="/guardados" className="nav-item" data-testid="sidebar-guardados"><Bookmark size={18}/>Guardados</NavLink>
        <NavLink to="/historial" className="nav-item" data-testid="sidebar-historial"><CalendarDays size={18}/>Historial</NavLink>
        <NavLink to="/notificaciones" className="nav-item" data-testid="sidebar-notificaciones"><Bell size={18}/>Notificaciones {unread>0&&<span className="notification-count">{unread}</span>}</NavLink>
      </nav>
      <Link to="/perfil" className="profile-mini" data-testid="sidebar-profile">
        <span className="avatar">{initials(display)}</span>
        <span><b data-testid="sidebar-username">{display}</b><small data-testid="sidebar-role">{user?.role}</small><small data-testid="sidebar-program">{user?.program || 'Sin programa'}</small></span>
      </Link>
    </aside>
    <main className="main">
      <header className="topbar">
        <button className="icon-btn mobile-only" data-testid="mobile-menu-button" aria-label="Menú de navegación" aria-expanded={mobileMenu} onClick={()=>setMobileMenu(!mobileMenu)}>{mobileMenu?<X size={18}/>:<Menu size={18}/>}</button>
        <span className="eyebrow" data-testid="header-colombia-date">{today} · COL</span>
        <Link className="icon-btn" to="/notificaciones" data-testid="header-notifications"><Bell size={18}/></Link>
        <Link className="avatar" to="/perfil" data-testid="header-profile">{initials(display)}</Link>
        <button className="icon-btn" onClick={logout} title="Cerrar sesión" data-testid="logout-button"><LogOut size={16}/></button>
      </header>
      {children}
    </main>
    {mobileMenu&&<nav className="mobile-drawer" data-testid="mobile-navigation-menu">{[...nav,{to:'/guardados',label:'Guardados',icon:Bookmark},{to:'/notificaciones',label:'Notificaciones',icon:Bell},{to:'/historial',label:'Historial',icon:CalendarDays},{to:'/perfil',label:'Perfil',icon:UserRound}].map(n=><NavLink key={n.to} to={n.to} data-testid={`mobile-menu-${n.to==='/'?'inicio':n.to.slice(1)}`}><n.icon size={18}/>{n.label}</NavLink>)}</nav>}
    <nav className="bottom-nav">{nav.filter(n=>['/','/dudas','/grupo','/rutas'].includes(n.to)).map(n=><NavLink key={n.to} to={n.to} end={n.to==='/'} data-testid={`bottom-${n.label.toLowerCase().replace(' ','-')}`}><n.icon size={19}/><span>{n.label}</span></NavLink>)}<button className="bottom-more" data-testid="bottom-more-button" onClick={()=>setMobileMenu(!mobileMenu)}><Menu size={19}/><span>Más</span></button></nav>
  </div>;
}

function SearchBox({value,onChange,placeholder='Buscar...'}:{value:string;onChange:(s:string)=>void;placeholder?:string}){
  return <label className="search"><Search size={18}/><input data-testid="global-search-input" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>{value&&<button className="icon-btn btn-small" onClick={()=>onChange('')} data-testid="clear-search-button"><X size={15}/></button>}</label>;
}

function Toast({message,onClose}:{message:string;onClose:()=>void}){useEffect(()=>{const t=setTimeout(onClose,2800);return()=>clearTimeout(t)},[onClose]);return <div className="toast" data-testid="success-toast">{message}</div>;}
function PageHead({eyebrow,title,description,action}:{eyebrow:string;title:string;description?:string;action?:React.ReactNode}){return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1 data-testid="page-title">{title}</h1>{description&&<p>{description}</p>}</div>{action}</div>;}

// ---------- Home w/ grouped search ----------
function Home(){
  const {courses,events,error:academicError}=useAcademic();
  const [browse,setBrowse]=useState(false);
  const [realPeople,setRealPeople]=useState<any[]>([]);
  const [localEvents]=usePersist<AcademicEvent[]>('uao-events',[]);
  const activity=[...events,...localEvents].sort((a,b)=>b.created_at.localeCompare(a.created_at));
  const [customResources]=usePersist<Resource[]>('uao-custom-resources',[]);
  const searchResources=useMemo(()=>[...customResources,...seedResources],[customResources]);
  const searchSubjects=useMemo(()=>[...courses.map(c=>({id:c.id,name:c.name,code:c.code,color:'#1769aa',progress:0})),...subjects.filter(s=>!courses.some(c=>c.name===s.name))],[courses]);
  useEffect(()=>{let active=true;Promise.all(courses.map(c=>req<Member[]>(`/api/courses/${c.id}/members`).then(ms=>ms.map(m=>({...m,id:`${c.id}-${m.user_id}`,name:m.custom_username||m.name,subject:c.name,description:m.program||'',availability:'Integrante de tu asignatura'}))))).then(rows=>active&&setRealPeople(rows.flat())).catch(()=>{if(active)setRealPeople([]);});return()=>{active=false;};},[courses]);
  const [q,setQ]=useState('');
  const [subjectFilter,setSubjectFilter]=useState('Todas');
  const [typeFilter,setTypeFilter]=useState('Todos');
  const [statusFilter,setStatusFilter]=useState('Todos');
  const [sort,setSort]=useState<'relevantes'|'recientes'>('relevantes');
  const [questionsPersisted]=usePersist<Question[]>('uao-questions',initialQuestions);
  const navigate=useNavigate();
  const query = q.trim().toLowerCase();

  const filtered = useMemo(()=>{
    const matches = (text:string) => query ? text.toLowerCase().includes(query) : true;
    const subjOk = (s:string) => subjectFilter==='Todas' || s===subjectFilter;
    const typeOk = (want:string) => typeFilter==='Todos' || typeFilter===want;
    const statusOk = (s:string) => statusFilter==='Todos' || s===statusFilter;

    let dudas = questionsPersisted.filter(x => matches(`${x.title} ${x.description} ${x.subject} ${x.tags.join(' ')}`) && subjOk(x.subject) && statusOk(x.status));
    if (typeFilter!=='Todos' && typeFilter!=='Dudas') dudas = [];
    let personas = [...realPeople,...people].filter(p => matches(`${p.name} ${p.subject} ${p.role} ${p.description}`) && subjOk(p.subject));
    if (typeFilter!=='Todos' && typeFilter!=='Personas') personas = [];
    let recursos = searchResources.filter(r => matches(`${r.name} ${r.subject} ${r.type} ${r.description}`) && subjOk(r.subject));
    if (typeFilter!=='Todos' && typeFilter!=='Recursos') recursos = [];
    let gruposList = [...courses.map(c=>({id:c.id,name:c.name,subject:c.name,members:c.member_ids.length,description:c.description})),...groups].filter(g => matches(`${g.name} ${g.subject} ${g.description}`) && subjOk(g.subject));
    if (typeFilter!=='Todos' && typeFilter!=='Grupos') gruposList = [];
    let asignaturas = searchSubjects.filter(s => matches(`${s.name} ${s.code}`) && (subjectFilter==='Todas' || s.name===subjectFilter));
    if (typeFilter!=='Todos' && typeFilter!=='Asignaturas') asignaturas = [];

    if (sort==='recientes') dudas = [...dudas].sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0));
    if(statusFilter!=='Todos'){personas=[];recursos=[];gruposList=[];asignaturas=[];}
    return { dudas, personas, recursos, grupos: gruposList, asignaturas };
  }, [query, subjectFilter, typeFilter, statusFilter, sort, questionsPersisted, courses, realPeople, searchSubjects, searchResources]);

  const total = filtered.dudas.length + filtered.personas.length + filtered.recursos.length + filtered.grupos.length + filtered.asignaturas.length;
  const searching = browse || query.length > 0 || subjectFilter!=='Todas' || typeFilter!=='Todos' || statusFilter!=='Todos';

  return <div className="content">
    <section className="hero">
      <div className="eyebrow">ENCONTRAR · COORDINAR · SABER A QUIÉN ACUDIR</div>
      <h1>Hola, ¿qué necesitas encontrar hoy?</h1>
      <p>Un punto de apoyo para avanzar en tus clases, coordinar con tu grupo y encontrar a la persona correcta.</p>
      <SearchBox value={q} onChange={setQ} placeholder="Buscar una asignatura, duda, recurso o ruta de apoyo…"/>
      <button className="btn btn-light btn-small" style={{marginTop:14,position:'relative',zIndex:1}} data-testid="browse-search-filters" onClick={()=>setBrowse(!browse)}>{browse?'Cerrar exploración':'Explorar con filtros'}</button>
    </section>
    {academicError&&<div className="academic-error" data-testid="home-academic-error">{academicError}</div>}

    {searching ? (
      <div className="section" data-testid="search-results">
        <div className="filters">
          <select className="select" value={subjectFilter} onChange={e=>setSubjectFilter(e.target.value)} data-testid="search-filter-subject">
            <option>Todas</option>
            {searchSubjects.map(s=><option key={s.id}>{s.name}</option>)}
          </select>
          <select className="select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} data-testid="search-filter-type">
            <option>Todos</option><option>Dudas</option><option>Personas</option><option>Recursos</option><option>Grupos</option><option>Asignaturas</option>
          </select>
          <select className="select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} data-testid="search-filter-status">
            <option>Todos</option><option>Sin respuesta</option><option>En discusión</option><option>Resuelta</option>
          </select>
          <button className="btn btn-light btn-small" onClick={()=>setSort(sort==='recientes'?'relevantes':'recientes')} data-testid="search-sort-button">
            {sort==='recientes' ? 'Más recientes' : 'Más relevantes'} <ChevronRight size={14}/>
          </button>
          {searching && <button className="btn btn-light btn-small" onClick={()=>{setQ('');setSubjectFilter('Todas');setTypeFilter('Todos');setStatusFilter('Todos');setBrowse(false);}} data-testid="clear-filters-button">Limpiar</button>}
        </div>
        <div className="section-title"><h2>{total} resultado{total===1?'':'s'} para “{query||'todo'}”</h2><span className="muted">Búsqueda agrupada</span></div>

        {total===0 && <div className="empty" data-testid="search-empty"><Search size={28}/><div>No encontramos resultados.</div><span>Prueba con otra palabra o retira algún filtro.</span></div>}

        {filtered.dudas.length>0 && <div className="search-group" data-testid="search-group-dudas">
          <div className="section-title"><h2>DUDAS · {filtered.dudas.length}</h2><Link to="/dudas" className="muted">Ver todas <ChevronRight size={14}/></Link></div>
          <div className="questions">{filtered.dudas.slice(0,4).map(x=><Link key={x.id} className="question" to={`/dudas/${x.id}`} data-testid={`search-duda-${x.id}`}>
            <div className="question-top"><div><h3>{x.title}</h3><div className="meta"><span>{x.subject}</span><span>·</span><span>{x.author}</span></div></div><span className={`status ${x.status==='Resuelta'?'resolved':x.status==='En discusión'?'discussion':'open'}`}>{x.status}</span></div>
            <p>{x.description}</p>
          </Link>)}</div>
        </div>}

        {filtered.personas.length>0 && <div className="search-group" data-testid="search-group-personas">
          <div className="section-title"><h2>PERSONAS · {filtered.personas.length}</h2><Link to="/rutas/monitor" className="muted">Ver rutas <ChevronRight size={14}/></Link></div>
          <div className="people-grid">{filtered.personas.map(p=><div className="resource" key={p.id} data-testid={`search-persona-${p.id}`}>
            <div className="answer-head"><span className="avatar">{initials(p.name)}</span><div><h3 style={{margin:0}}>{p.name}</h3><span className="muted">{p.subject} · {p.role}</span></div></div>
            <p>{p.description}</p><div className="form-note"><CalendarDays size={14}/> {p.availability}</div>
          </div>)}</div>
        </div>}

        {filtered.recursos.length>0 && <div className="search-group" data-testid="search-group-recursos">
          <div className="section-title"><h2>RECURSOS · {filtered.recursos.length}</h2><Link to="/rutas/recursos" className="muted">Ver recursos <ChevronRight size={14}/></Link></div>
          <div className="resource-grid">{filtered.recursos.map(r=><div className="resource" key={r.id} data-testid={`search-recurso-${r.id}`}>
            <div className="resource-top"><span className="tag">{r.type}</span></div>
            <h3>{r.name}</h3><p>{r.description}</p><div className="meta"><span>{r.subject}</span><span>·</span><span>{colombiaTime(r.date)}</span></div><Link to="/rutas/recursos" className="btn btn-light btn-small" data-testid={`search-open-resource-${r.id}`}>Ver recurso</Link>
          </div>)}</div>
        </div>}

        {filtered.grupos.length>0 && <div className="search-group" data-testid="search-group-grupos">
          <div className="section-title"><h2>GRUPOS · {filtered.grupos.length}</h2><Link to="/grupo" className="muted">Ver mi grupo <ChevronRight size={14}/></Link></div>
          <div className="resource-grid">{filtered.grupos.map(g=><div className="resource" key={g.id} data-testid={`search-grupo-${g.id}`}>
            <div className="resource-top"><span className="tag">{g.subject}</span><span className="muted">{g.members} integrantes</span></div>
            <h3>{g.name}</h3><p>{g.description}</p><Link className="btn btn-light btn-small" data-testid={`search-open-group-${g.id}`} to={courses.some(c=>c.id===g.id)?`/grupo?course=${g.id}`:'/grupo'}>Abrir grupo</Link>
          </div>)}</div>
        </div>}

        {filtered.asignaturas.length>0 && <div className="search-group" data-testid="search-group-asignaturas">
          <div className="section-title"><h2>ASIGNATURAS · {filtered.asignaturas.length}</h2></div>
          <div className="grid-subjects">{filtered.asignaturas.map(s=><Link to={courses.some(c=>c.id===s.id)?`/asignaturas/${s.id}`:`/dudas?subject=${encodeURIComponent(s.name)}`} className="subject" key={s.id} style={{borderTopColor:s.color}} data-testid={`search-asignatura-${s.id}`}>
            <span className="eyebrow">{s.code}</span><h3>{s.name}</h3><span className="muted" style={{fontSize:12}}>Progreso del curso</span><div className="meter"><i style={{width:`${s.progress}%`,background:s.color}}/></div>
          </Link>)}</div>
        </div>}
      </div>
    ) : (
      <>
        <div className="section">
          <div className="section-title"><h2>MIS ASIGNATURAS</h2><Link className="muted" to="/asignaturas" data-testid="home-manage-courses">Ver asignaturas <ChevronRight size={14}/></Link></div>
          {!courses.length&&<div className="empty" data-testid="home-courses-empty">Aún no tienes asignaturas. <Link to="/asignaturas" data-testid="home-join-course">Unirme con un código</Link></div>}
          <div className="grid-subjects">{courses.map(s=><Link to={`/asignaturas/${s.id}`} className="subject" key={s.id} data-testid={`subject-card-${s.id}`}>
            <span className="eyebrow">{s.code}</span><h3>{s.name}</h3><span className="muted" style={{fontSize:12}}>{s.member_ids.length} integrantes</span>
          </Link>)}</div>
        </div>
        <div className="section">
          <div className="section-title"><h2>ACTIVIDAD RECIENTE</h2><Link to="/notificaciones" className="muted" data-testid="view-all-notifications">Ver todo <ChevronRight size={14}/></Link></div>
          <div className="activity">{activity.slice(0,4).map(n=><Link to={n.path} data-testid={`home-activity-${n.id}`} className="activity-row" key={n.id}><span className="activity-dot"/><span>{n.text}</span><time>{colombiaTime(n.created_at)}</time></Link>)}</div>{activity.length===0&&<p className="muted" data-testid="home-activity-empty">No hay actividad reciente.</p>}
        </div>
        <div className="section">
          <div className="section-title"><h2>ACCESOS RÁPIDOS</h2></div>
          <div className="quick-grid">
            <button className="quick" onClick={()=>{const el=document.querySelector<HTMLInputElement>('[data-testid=global-search-input]'); el?.focus();}} data-testid="quick-search"><Search size={18}/>Buscar respuestas</button>
            <Link to="/dudas/nueva" className="quick" data-testid="quick-ask"><Plus size={18}/>Preguntar</Link>
            <Link to="/grupo" className="quick" data-testid="quick-group"><Users size={18}/>Mi grupo</Link>
            <Link to="/rutas" className="quick" data-testid="quick-support"><Lightbulb size={18}/>Buscar apoyo</Link>
          </div>
        </div>
      </>
    )}
  </div>;
}

// ---------- Existing pages (kept intact) ----------
function QuestionCard({q,onSave,saved}:{q:Question;onSave:()=>void;saved:boolean}){return <Link className="question" to={`/dudas/${q.id}`} data-testid={`question-card-${q.id}`}><div className="question-top"><div><h3>{q.title}</h3><div className="meta"><span>{q.subject}</span><span>·</span><span>{q.author}</span><span>·</span><span>{q.date}</span></div></div><span className={`status ${q.status==='Resuelta'?'resolved':q.status==='En discusión'?'discussion':'open'}`}>{q.status}</span></div><p>{q.description}</p><div className="meta"><MessageCircle size={14}/>{q.answers} respuestas <button className="icon-btn btn-small" onClick={e=>{e.preventDefault();onSave()}} data-testid={`save-question-${q.id}`}><Bookmark size={15} fill={saved?'currentColor':'none'}/></button></div><div className="tags">{q.tags.map(t=><span className="tag" key={t}>#{t}</span>)}</div></Link>;}

function Doubts(){const [questions,setQuestions]=usePersist<Question[]>('uao-questions',initialQuestions);const [saved,setSaved]=usePersist<string[]>('uao-saved-questions',[]);const [query,setQuery]=useState('');const [filter,setFilter]=useState('Todas');const [subjectF,setSubjectF]=useState('Asignatura: todas');const [toast,setToast]=useState('');const filtered=questions.filter(q=>(q.title+q.description+q.subject+q.tags.join(' ')).toLowerCase().includes(query.toLowerCase())&&(filter==='Todas'||q.status===filter)&&(subjectF==='Asignatura: todas'||q.subject===subjectF));return <div className="content"><PageHead eyebrow="ENCONTRAR · DUDAS" title="Encuentra respuestas antes de volver a preguntar." description="Explora lo que ya está conversando la comunidad o abre un espacio para tu pregunta." action={<Link to="/dudas/nueva" className="btn btn-primary" data-testid="new-question-button"><Plus size={17}/>Publicar una duda</Link>}/><SearchBox value={query} onChange={setQuery} placeholder="¿Qué necesitas resolver?"/><div className="filters"><select className="select" value={filter} onChange={e=>setFilter(e.target.value)} data-testid="question-status-filter"><option>Todas</option><option>Sin respuesta</option><option>En discusión</option><option>Resuelta</option></select><select className="select" value={subjectF} onChange={e=>setSubjectF(e.target.value)} data-testid="question-subject-filter"><option>Asignatura: todas</option>{subjects.map(s=><option key={s.id}>{s.name}</option>)}</select></div><div className="section-title"><h2>{filtered.length} preguntas para explorar</h2><span className="muted">Datos de demostración</span></div><div className="questions">{filtered.length?filtered.map(q=><QuestionCard key={q.id} q={q} saved={saved.includes(q.id)} onSave={()=>{setSaved(saved.includes(q.id)?saved.filter(id=>id!==q.id):[...saved,q.id]);setToast(saved.includes(q.id)?'Duda retirada de guardados':'Duda guardada')}}/>):<div className="empty" data-testid="questions-empty"><Search size={28}/><div>No encontramos resultados.</div><span>Prueba con otra palabra o publica una nueva duda.</span></div>}</div>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</div>;}

function NewQuestion(){const { user } = useAuth();const [questions,setQuestions]=usePersist<Question[]>('uao-questions',initialQuestions);const [form,setForm]=useState({title:'',subject:'Cálculo I',description:'',tag:''});const [anonymous,setAnonymous]=useState(false);const [toast,setToast]=useState('');const navigate=useNavigate();const authorName=user?.custom_username||user?.name||'Estudiante';const submit=(e:React.FormEvent)=>{e.preventDefault();if(!form.title||!form.description)return;const id=`q${Date.now()}`;setQuestions([{id,title:form.title,subject:form.subject,description:form.description,date:'Ahora',answers:0,status:'Sin respuesta',author:anonymous?'Anónimo':authorName,tags:form.tag?[form.tag]:['nueva']},...questions]);setToast('Tu duda fue publicada correctamente.');setTimeout(()=>navigate(`/dudas/${id}`),700)};return <div className="content"><PageHead eyebrow="DUDAS · NUEVA PUBLICACIÓN" title="Haz tu pregunta con claridad." description="Una buena pregunta ayuda a que la comunidad pueda orientarte más rápido."/><form className="form" onSubmit={submit}><div className="field"><label htmlFor="title">Título de la duda</label><input id="title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Ej. ¿Cómo interpreto este resultado?" required data-testid="question-title-input"/></div><div className="field"><label htmlFor="subject">Asignatura</label><select id="subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} data-testid="question-subject-input">{subjects.map(s=><option key={s.id}>{s.name}</option>)}</select></div><div className="field"><label htmlFor="description">Cuéntanos un poco más</label><textarea id="description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="¿Qué has intentado? ¿En qué parte te quedaste?" required data-testid="question-description-input"/></div><div className="field"><label htmlFor="tag">Tema <span className="muted">(opcional)</span></label><input id="tag" value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})} placeholder="Ej. integrales, laboratorio…" data-testid="question-tag-input"/></div><div className="form-note"><ShieldCheck size={16}/> Puedes publicar de forma anónima cuando no quieras exponer tu identidad.</div><label className="checkline"><input type="checkbox" checked={anonymous} onChange={e=>setAnonymous(e.target.checked)} data-testid="anonymous-question-checkbox"/> Publicar de forma anónima</label><div style={{display:'flex',gap:10}}><Link to="/dudas" className="btn btn-light" data-testid="cancel-question-button">Cancelar</Link><button className="btn btn-primary" type="submit" data-testid="publish-question-button"><Send size={16}/>Publicar duda</button></div></form>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</div>;}

function QuestionDetail(){const {id}=useParams();const { user } = useAuth();const [questions,setQuestions]=usePersist<Question[]>('uao-questions',initialQuestions);const [answers,setAnswers]=usePersist<Record<string,Answer[]>>('uao-answers',initialAnswers);const [saved,setSaved]=usePersist<string[]>('uao-saved-questions',[]);const [text,setText]=useState('');const [toast,setToast]=useState('');const q=questions.find(x=>x.id===id);if(!q)return <div className="content"><div className="empty">Esta duda ya no está disponible.</div></div>;const list=answers[q.id]||[];const solve=(answerId:string)=>{setAnswers({...answers,[q.id]:list.map(a=>({...a,solution:a.id===answerId}))});setQuestions(questions.map(x=>x.id===q.id?{...x,status:'Resuelta'}:x));setToast('La respuesta fue marcada como solución.');};const authorName=user?.custom_username||user?.name||'Estudiante';return <div className="content"><div className="detail"><Link to="/dudas" className="muted" data-testid="back-to-questions">← Volver a dudas</Link><div className="detail-card" style={{marginTop:18}}><div className="meta"><span className="eyebrow">{q.subject}</span><span className={`status ${q.status==='Resuelta'?'resolved':'discussion'}`}>{q.status}</span></div><h1 data-testid="question-detail-title">{q.title}</h1><div className="meta"><span>{q.author}</span><span>·</span><span>{q.date}</span></div><div className="question-body">{q.description}</div><div className="tags">{q.tags.map(t=><span className="tag" key={t}>#{t}</span>)}</div><button className="btn btn-light btn-small" onClick={()=>{setSaved(saved.includes(q.id)?saved.filter(x=>x!==q.id):[...saved,q.id]);setToast(saved.includes(q.id)?'Duda retirada de guardados':'Duda guardada')}} data-testid="detail-save-question"><Bookmark size={15} fill={saved.includes(q.id)?'currentColor':'none'}/>{saved.includes(q.id)?'Guardada':'Guardar duda'}</button></div><div className="section"><div className="section-title"><h2>RESPUESTAS · {list.length}</h2><span className="muted">Ayuda a la conversación</span></div><div className="panel">{list.map(a=><div className="answer" key={a.id}><div className="answer-head"><span className="avatar">{a.author.split(' ').map(x=>x[0]).join('')}</span><b>{a.author}</b><span className="tag">{a.role}</span>{a.solution&&<span className="status resolved"><Check size={12}/> Solución</span>}</div><p>{a.text}</p><div className="answer-actions"><button className="btn btn-light btn-small" data-testid={`useful-answer-${a.id}`}><ThumbsUp size={14}/>Útil · {a.useful}</button>{!a.solution&&<button className="btn btn-light btn-small" onClick={()=>solve(a.id)} data-testid={`solution-answer-${a.id}`}><CheckCircle2 size={14}/>Marcar solución</button>}</div></div>)}<form onSubmit={e=>{e.preventDefault();if(!text)return;const a={id:`a${Date.now()}`,author:authorName,role:'Estudiante',text,useful:0};setAnswers({...answers,[q.id]:[...list,a]});setText('');setToast('Tu respuesta fue publicada.')}} style={{borderTop:'1px solid var(--line)',paddingTop:20}}><div className="field"><label htmlFor="answer">Responder a esta duda</label><textarea id="answer" value={text} onChange={e=>setText(e.target.value)} placeholder="Comparte una explicación, recurso o pista…" data-testid="answer-input"/></div><button className="btn btn-dark" type="submit" data-testid="submit-answer-button"><Send size={15}/>Responder</button></form></div></div></div>{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</div>;}

function Group(){const [tasks,setTasks]=usePersist<Task[]>('uao-tasks',initialTasks);const [show,setShow]=useState(false);const [name,setName]=useState('');const [toast,setToast]=useState('');const next=(s:Task['status'])=>s==='Pendiente'?'En proceso':s==='En proceso'?'Completada':'Pendiente';return <div className="content"><PageHead eyebrow="COORDINAR · MI GRUPO" title="Que el trabajo avance, sin perseguir a nadie." description="Un espacio compartido para ver quién está, cuándo pueden reunirse y qué sigue." action={<button className="btn btn-primary" onClick={()=>setShow(true)} data-testid="create-task-button"><Plus size={17}/>Crear tarea</button>}/><div className="stat-row"><div className="stat"><span className="eyebrow">INTEGRANTES</span><strong>4</strong><span className="muted">2 conectados ahora</span></div><div className="stat"><span className="eyebrow">TAREAS ABIERTAS</span><strong>{tasks.filter(t=>t.status!=='Completada').length}</strong><span className="muted">de {tasks.length} en total</span></div><div className="stat"><span className="eyebrow">PRÓXIMA REUNIÓN</span><strong>Mar 3:00</strong><span className="muted">Sala de estudio 2</span></div></div><div className="two-col"><div className="list-card"><div className="section-title"><h2>TAREAS DEL GRUPO</h2><Link to="/grupo/tareas" className="muted" data-testid="view-all-tasks">Ver todas <ChevronRight size={14}/></Link></div>{tasks.map(t=><div className="task" key={t.id}><div><strong>{t.name}</strong><small>Responsable: {t.responsible}</small></div><span className="task-meta muted">Entrega {t.due}</span><button className={`status ${t.status==='Completada'?'resolved':t.status==='En proceso'?'discussion':'open'}`} onClick={()=>{setTasks(tasks.map(x=>x.id===t.id?{...x,status:next(x.status)}:x));setToast('Estado de tarea actualizado.')}} data-testid={`task-status-${t.id}`}>{t.status}</button></div>)}</div><div className="list-card"><div className="section-title"><h2>INTEGRANTES</h2><span className="muted">4 personas</span></div>{['Sofía Martínez','Daniel Rojas','Laura Pérez','Mateo Gómez'].map((p,i)=><div className="activity-row" key={p}><span className="avatar">{p.split(' ').map(x=>x[0]).join('')}</span><span><b>{p}</b><small className="muted" style={{display:'block'}}>{i===0?'Tú · Coordinadora':i===1?'Estudiante':'Estudiante'}</small></span><span className="activity-dot" style={{background:i<2?'#2eaa80':'#bbc7d1'}}/></div>)}</div></div><div className="section"><div className="section-title"><h2>HORARIOS COMUNES</h2><Link to="/grupo/horarios" className="btn btn-light btn-small" data-testid="view-schedules-button">Ver agenda <CalendarDays size={15}/></Link></div><div className="calendar"><div className="day">Lunes</div><div className="day">Martes</div><div className="day">Miércoles</div><div className="day">Jueves</div><div className="day">Viernes</div><div>2:00 p. m.</div><div className="slot">3:00 p. m.<br/><small>Todos disponibles</small></div><div>2:00 p. m.</div><div>2:00 p. m.</div><div>4:00 p. m.</div></div></div>{show&&<div className="toast" style={{bottom:88}}><form onSubmit={e=>{e.preventDefault();if(name){setTasks([...tasks,{id:`t${Date.now()}`,name,responsible:'Sofía',due:'25 mar',status:'Pendiente'}]);setName('');setShow(false);setToast('Tu tarea fue creada.')}}}><div style={{display:'flex',gap:8}}><input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre de la tarea" data-testid="task-name-input"/><button className="btn btn-primary btn-small" data-testid="save-task-button">Crear</button></div></form></div>}{toast&&<Toast message={toast} onClose={()=>setToast('')}/>}</div>;}

function Schedules(){const [selected,setSelected]=useState('');return <div className="content"><PageHead eyebrow="MI GRUPO · HORARIOS" title="Encuentren un momento que funcione para todos." description="Comparamos la disponibilidad simulada de los integrantes de tu grupo."/><div className="panel"><div className="eyebrow">HORARIOS DISPONIBLES PARA TODOS</div><div className="section" style={{display:'grid',gap:12}}>{['Martes · 3:00 p. m. – 4:00 p. m.','Miércoles · 10:00 a. m. – 11:00 a. m.','Jueves · 2:00 p. m. – 3:00 p. m.'].map(slot=><button className={`quick ${selected===slot?'selected':''}`} key={slot} onClick={()=>setSelected(slot)} data-testid={`schedule-option-${slot.slice(0,3).toLowerCase()}`}><CalendarDays size={18}/>{slot}<span style={{marginLeft:'auto'}}>{selected===slot?<CheckCircle2 size={18}/>:<ChevronRight size={18}/>}</span></button>)}</div>{selected&&<div className="form-note" style={{marginTop:20}}>Horario elegido: <b>{selected}</b>. Se notificará al grupo.</div>}</div></div>;}

function Files(){return <div className="content"><PageHead eyebrow="MI GRUPO · ARCHIVOS" title="Todo lo que el grupo necesita, en un solo lugar." description="Documentos, enlaces y acuerdos vinculados a tus asignaturas." action={<button className="btn btn-primary" data-testid="add-file-button"><Plus size={17}/>Agregar archivo</button>}/><div className="resource-grid">{seedResources.map(r=><div className="resource" key={r.id}><div className="resource-top"><span className="tag">{r.type}</span><button className="icon-btn" data-testid={`save-file-${r.id}`}><Bookmark size={15}/></button></div><h3>{r.name}</h3><p>{r.description}</p><div className="meta"><span>{r.subject}</span><span>·</span><span>{r.date}</span></div><div style={{display:'flex',gap:8,marginTop:17}}><button className="btn btn-light btn-small" data-testid={`view-file-${r.id}`}>Ver <ExternalLink size={13}/></button><button className="btn btn-light btn-small" data-testid={`save-resource-${r.id}`}><Bookmark size={13}/>Guardar</button></div></div>)}</div></div>;}

function RoutesPage(){const routes=[{icon:'Users',title:'Docente',text:'Consulta al docente relacionado con tu asignatura.',to:'/rutas/docente'},{icon:'Lightbulb',title:'Monitor',text:'Encuentra un monitor que pueda orientarte.',to:'/rutas/monitor'},{icon:'BookOpen',title:'Recursos validados',text:'Consulta materiales seleccionados y organizados.',to:'/rutas/recursos'}];return <div className="content"><PageHead eyebrow="SABER A QUIÉN ACUDIR" title="No tienes que resolverlo todo sola." description="Elige la ruta de apoyo que mejor se ajusta a lo que necesitas hoy."/><div className="route-grid">{routes.map(r=><Link to={r.to} className="route" key={r.title} data-testid={`support-route-${r.title.toLowerCase().replace(' ','-')}`}><div className="route-icon"><Icon name={r.icon}/></div><h3>{r.title}</h3><p>{r.text}</p><span className="btn btn-light btn-small">Ver ruta <ChevronRight size={14}/></span></Link>)}</div><div className="section panel"><div className="eyebrow">¿NO SABES POR DÓNDE EMPEZAR?</div><h2 style={{fontFamily:'Space Grotesk'}}>Describe lo que necesitas y te orientamos.</h2><p className="muted">También puedes publicar una duda y dejar que la comunidad te acerque a la persona correcta.</p><Link to="/dudas/nueva" className="btn btn-dark" data-testid="routes-ask-button">Publicar una duda <Send size={15}/></Link></div></div>;}

function PeoplePage({kind}:{kind:'docente'|'monitor'}){const list = people.filter(p=>p.role.toLowerCase()===kind);return <div className="content"><PageHead eyebrow={`RUTAS · ${kind.toUpperCase()}`} title={kind==='docente'?'Habla con tu docente.':'Encuentra a un monitor disponible.'} description="Información de demostración para explorar cómo podría funcionar esta ruta."/><div className="people-grid">{list.map(p=><div className="resource" key={p.id}><div className="answer-head"><span className="avatar">{initials(p.name)}</span><div><h3 style={{margin:0}}>{p.name}</h3><span className="muted">{p.subject} · {p.role}</span></div></div><p>{p.description}</p><div className="form-note"><CalendarDays size={14}/> {p.availability}</div><div style={{display:'flex',gap:8,marginTop:15}}><button className="btn btn-light btn-small" data-testid={`view-person-${p.id}`}>Ver perfil</button><button className="btn btn-primary btn-small" data-testid={`contact-person-${p.id}`}>{kind==='monitor'?'Solicitar orientación':'Ver ruta de contacto'}</button></div></div>)}</div></div>;}

function Resources(){const [saved,setSaved]=usePersist<string[]>('uao-saved-resources',[]);const [subject,setSubject]=useState('Todas');const [type,setType]=useState('Tipo: todos');const list=seedResources.filter(r=>(subject==='Todas'||r.subject===subject)&&(type==='Tipo: todos'||r.type===type));return <div className="content"><PageHead eyebrow="RUTAS · RECURSOS" title="Materiales para seguir avanzando." description="Una colección local de demostración, organizada para encontrar lo que necesitas."/><div className="filters"><select className="select" value={subject} onChange={e=>setSubject(e.target.value)} data-testid="resource-subject-filter"><option>Todas</option>{subjects.map(s=><option key={s.id}>{s.name}</option>)}</select><select className="select" value={type} onChange={e=>setType(e.target.value)} data-testid="resource-type-filter"><option>Tipo: todos</option><option>Guía</option><option>Apunte</option><option>Documento</option><option>Material de estudio</option></select></div><div className="resource-grid">{list.map(r=><div className="resource" key={r.id}><div className="resource-top"><span className="status resolved"><CheckCircle2 size={12}/> Recurso de demostración</span><button className="icon-btn" onClick={()=>setSaved(saved.includes(r.id)?saved.filter(x=>x!==r.id):[...saved,r.id])} data-testid={`bookmark-resource-${r.id}`}><Bookmark size={15} fill={saved.includes(r.id)?'currentColor':'none'}/></button></div><h3>{r.name}</h3><p>{r.description}</p><div className="meta"><span>{r.subject}</span><span>·</span><span>{r.type}</span><span>·</span><span>{r.date}</span></div></div>)}</div></div>;}

function Profile(){
  const { user, refresh } = useAuth();
  const {courses}=useAcademic();
  const [profileQuestions]=usePersist<Question[]>('uao-questions',initialQuestions);
  const [savedQs]=usePersist<string[]>('uao-saved-questions',[]);
  const [savedRs]=usePersist<string[]>('uao-saved-resources',[]);
  const [editing,setEditing]=useState(false);
  const [name,setName]=useState(user?.custom_username||'');
  const [program,setProgram]=useState(user?.program||'');
  const [err,setErr]=useState('');
  const [toast,setToast]=useState('');
  const startEdit=()=>{setName(user?.custom_username||'');setProgram(user?.program||'');setErr('');setEditing(true);};
  const save = async (e:React.FormEvent) => { e.preventDefault(); setErr('');
    if(!program){ setErr('Selecciona tu programa de ingeniería.'); return; }
    try { await authApi.setUsername(name.trim(), program); await refresh(); setEditing(false); setToast('Perfil actualizado.'); } catch(ex:any){ setErr(ex.message); }
  };
  return <div className="content">
    <PageHead eyebrow="MI INFORMACIÓN" title="Tu perfil académico." description="Un resumen para que las personas sepan a quién están leyendo. No es una red social."/>
    <div className="profile-cover"/>
    <div className="profile-body">
      <div className="avatar profile-avatar">{initials(user?.custom_username||user?.name)}</div>
      {!editing
        ? <>
            <h2 style={{fontFamily:'Space Grotesk',marginBottom:4}} data-testid="profile-name">{user?.custom_username || user?.name || 'Usuario'}</h2>
            <span className="muted">{user?.email}</span>
            <div style={{marginTop:8}}><span className="tag" data-testid="profile-program">{user?.program || 'Programa no definido'}</span></div>
            <div style={{marginTop:8}}><span className="tag" data-testid="profile-role">{user?.role}</span><small className="muted" data-testid="profile-role-note"> · Rol autodeclarado</small></div>
            <button className="btn btn-light btn-small" style={{marginTop:12}} onClick={startEdit} data-testid="edit-username-button">Editar perfil</button>
          </>
        : <form className="form" onSubmit={save} style={{maxWidth:420}}>
            <div className="field"><label htmlFor="pname">Nombre visible</label><input id="pname" value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={24} required data-testid="edit-username-input"/></div>
            <div className="field"><label htmlFor="pprogram">Programa de ingeniería</label>
              <select id="pprogram" value={program} onChange={e=>setProgram(e.target.value)} required data-testid="edit-program-select">
                <option value="" disabled>Selecciona tu programa…</option>
                {PROGRAMS.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {err&&<div className="form-note" style={{background:'#fde8e8',color:'#a1272b'}} data-testid="profile-error">{err}</div>}
            <div style={{display:'flex',gap:8}}>
              <button type="button" className="btn btn-light btn-small" onClick={()=>setEditing(false)} data-testid="cancel-edit-profile-button">Cancelar</button>
              <button type="submit" className="btn btn-primary btn-small" data-testid="save-username-button">Guardar</button>
            </div>
          </form>}
      <div className="section">
        <div className="stat-row"><div className="stat"><span className="eyebrow">ASIGNATURAS</span><strong data-testid="profile-course-count">{courses.length}</strong></div><div className="stat"><span className="eyebrow">DUDAS REALIZADAS</span><strong data-testid="profile-question-count">{profileQuestions.filter(q=>q.authorId===user?.user_id).length}</strong></div><div className="stat"><span className="eyebrow">GUARDADOS</span><strong data-testid="profile-saved-count">{savedQs.length+savedRs.length}</strong></div></div>
        <h3 className="eyebrow">MIS ASIGNATURAS</h3>
        <div className="tags">{courses.map(s=><Link className="tag" key={s.id} to={`/asignaturas/${s.id}`} data-testid={`profile-course-${s.id}`}>{s.name}</Link>)}</div>{!courses.length&&<p className="muted" data-testid="profile-courses-empty">Aún no tienes asignaturas.</p>}
      </div>
    </div>
    {toast&&<Toast message={toast} onClose={()=>setToast('')}/>}
  </div>;
}

function Notifications(){const [items,setItems]=useState(notifications);return <div className="content"><PageHead eyebrow="TU INFORMACIÓN" title="Notificaciones." description="Lo importante de tu espacio académico, en un solo lugar." action={<button className="btn btn-light" onClick={()=>setItems(items.map(n=>({...n,read:true})))} data-testid="mark-all-read-button"><Check size={16}/>Marcar todas como leídas</button>}/><div className="panel">{items.map(n=><div className={`activity-row ${n.read?'':'unread'}`} key={n.id}><span className="activity-dot" style={{background:n.read?'#bbc7d1':'var(--red)'}}/><span>{n.text}<small className="muted" style={{display:'block',marginTop:5}}>{n.time}</small></span>{!n.read&&<button className="btn btn-light btn-small" onClick={()=>setItems(items.map(x=>x.id===n.id?{...x,read:true}:x))} data-testid={`mark-read-${n.id}`}>Marcar leída</button>}</div>)}</div></div>;}

function Saved(){const [qs]=usePersist<string[]>('uao-saved-questions',[]);const [rs]=usePersist<string[]>('uao-saved-resources',[]);const [questionsPersisted]=usePersist<Question[]>('uao-questions',initialQuestions);const savedQuestions=questionsPersisted.filter(q=>qs.includes(q.id));const savedResources=seedResources.filter(r=>rs.includes(r.id));return <div className="content"><PageHead eyebrow="TU INFORMACIÓN" title="Guardados." description="Vuelve rápido a lo que quieres revisar después."/><div className="section-title"><h2>DUDAS GUARDADAS</h2></div>{savedQuestions.length?<div className="questions">{savedQuestions.map(q=><QuestionCard key={q.id} q={q} saved onSave={()=>{}}/>)}</div>:<div className="empty" data-testid="saved-questions-empty"><Bookmark size={27}/><div>Aún no tienes dudas guardadas.</div><span>Explora Dudas y guarda las que quieras retomar.</span></div>}<div className="section-title" style={{marginTop:36}}><h2>RECURSOS GUARDADOS</h2></div>{savedResources.length?<div className="resource-grid">{savedResources.map(r=><div className="resource" key={r.id}><h3>{r.name}</h3><p>{r.description}</p></div>)}</div>:<div className="empty"><Bookmark size={27}/><div>Aún no tienes recursos guardados.</div></div>}</div>;}

// ---------- App root with auth guard ----------
function AppRouter(){
  const location = useLocation();
  const { user, loading } = useAuth();
  // Handle OAuth callback FIRST (must read from useLocation().hash, not window.location.hash)
  if (location.hash?.includes('session_id=')) return <AuthCallback/>;
  if (loading) return <div className="auth-shell"><div className="auth-card"><h1>Cargando…</h1></div></div>;
  if (!user) return <Login/>;
  if (!user.custom_username || !user.program || !user.role) return <Onboarding/>;
  return <AcademicProvider key={user.user_id}><Shell><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/inicio" element={<Home/>}/>
    <Route path="/asignaturas" element={<CoursesPage user={user}/>}/>
    <Route path="/asignaturas/:id" element={<CourseDetail user={user}/>}/>
    <Route path="/chats" element={<ChatsPage user={user}/>}/>
    <Route path="/asistente" element={<AssistantPage/>}/>
    <Route path="/historial" element={<ActivityPage user={user} history/>}/>
    <Route path="/dudas" element={<DoubtsPage user={user}/>}/>
    <Route path="/dudas/nueva" element={<NewDoubtPage user={user}/>}/>
    <Route path="/dudas/:id" element={<DoubtDetailPage user={user}/>}/>
    <Route path="/grupo" element={<GroupPage user={user}/>}/>
    <Route path="/grupo/horarios" element={<SchedulesPage user={user}/>}/>
    <Route path="/grupo/tareas" element={<GroupPage user={user}/>}/>
    <Route path="/grupo/archivos" element={<FilesPage user={user}/>}/>
    <Route path="/rutas" element={<RoutesPage/>}/>
    <Route path="/rutas/docente" element={<SupportPeoplePage kind="docente"/>}/>
    <Route path="/rutas/monitor" element={<SupportPeoplePage kind="monitor"/>}/>
    <Route path="/rutas/recursos" element={<ResourcesPage user={user}/>}/>
    <Route path="/perfil" element={<Profile/>}/>
    <Route path="/notificaciones" element={<ActivityPage user={user}/>}/>
    <Route path="/guardados" element={<SavedPage user={user}/>}/>
    <Route path="*" element={<div className="content"><h1>Página no encontrada</h1><Link to="/" data-testid="not-found-home">Volver a Inicio</Link></div>}/>
  </Routes></Shell></AcademicProvider>;
}

function App(){ return <BrowserRouter><AuthProvider><AppRouter/><Toaster position="top-center" richColors/></AuthProvider></BrowserRouter>; }
export default App;
