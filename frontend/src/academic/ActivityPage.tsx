import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { req, type AuthUser } from '../auth';
import { useAcademic } from './AcademicContext';
import { useLocal } from './localStore';
import { AcademicHead, Empty, ErrorNotice } from './UI';
import { colombiaTime } from './time';
import type { AcademicEvent } from './types';
export default function ActivityPage({user,history=false}:{user:AuthUser;history?:boolean}) {
  const {events,refresh,error}=useAcademic();const [local,setLocal]=useLocal<AcademicEvent[]>('uao-events',[],user.user_id);
  useEffect(()=>{refresh();},[refresh]);
  const items=[...events,...local].sort((a,b)=>b.created_at.localeCompare(a.created_at));
  const mark=async(id?:string)=>{try{await req(`/api/events${id?`/${id}`:''}/read`,{method:'POST'});setLocal(ns=>ns.map(n=>!id||n.id===id?{...n,read:true}:n));await refresh();toast.success('Notificaciones actualizadas');}catch(e:any){toast.error(e.message);}};
  return <div className="content"><AcademicHead eyebrow="TU INFORMACIÓN" title={history?'Historial.':'Notificaciones.'} action={!history&&<button className="btn btn-light" data-testid="mark-all-read-button" onClick={()=>mark()}><Check size={16}/>Marcar todas como leídas</button>}/><ErrorNotice error={error}/>{items.length?<div className="activity-list">{items.map(n=><div className={`activity-row ${n.read||history?'':'unread'}`} key={n.id} data-testid={`activity-${n.id}`}><Link to={n.path} data-testid={`activity-link-${n.id}`}><b>{n.text}</b><small>{colombiaTime(n.created_at)} · COL</small></Link>{!history&&!n.read&&<button className="btn btn-light btn-small" data-testid={`mark-read-${n.id}`} onClick={()=>mark(n.id)}>Marcar leída</button>}</div>)}</div>:<Empty>{history?'Aún no hay actividad registrada.':'No tienes notificaciones.'}</Empty>}</div>;
}