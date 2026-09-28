import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
export const AcademicHead = ({title,eyebrow,action}:{title:string;eyebrow:string;action?:React.ReactNode}) => <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1 data-testid="page-title">{title}</h1></div>{action}</div>;
export const ErrorNotice = ({error}:{error:string}) => error ? <div className="academic-error" role="alert" data-testid="academic-error">{error}</div> : null;
export const Loading = () => <div className="academic-loading" role="status" data-testid="academic-loading"><LoaderCircle size={18} className="spin"/>Cargando…</div>;
export const Empty = ({children}:{children:React.ReactNode}) => <div className="empty" data-testid="academic-empty">{children}</div>;
export const GroupLinks = () => {const [params]=useSearchParams();const course=params.get('course');const suffix=course?`?course=${encodeURIComponent(course)}`:'';return <nav className="academic-tabs" aria-label="Mi grupo"><Link data-testid="group-tab-tasks" to={`/grupo${suffix}`}>Tareas e integrantes</Link><Link data-testid="group-tab-schedules" to={`/grupo/horarios${suffix}`}>Horarios</Link><Link data-testid="group-tab-files" to={`/grupo/archivos${suffix}`}>Archivos y acuerdos</Link></nav>;};