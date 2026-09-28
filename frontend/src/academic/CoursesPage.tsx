import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Plus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { req, type AuthUser } from '../auth';
import { useAcademic } from './AcademicContext';
import { AcademicHead, Empty, ErrorNotice, Loading } from './UI';
import type { Course } from './types';

export default function CoursesPage({user}:{user:AuthUser}) {
  const {courses,loading,error:loadError,refresh}=useAcademic();
  const [params]=useSearchParams();
  const [code,setCode]=useState(params.get('join')||'');
  const [creating,setCreating]=useState(false);
  const [form,setForm]=useState({name:'',code:'',description:''});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const navigate=useNavigate();
  const join=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{
    let invite=code.trim(); if(invite.includes('://')) {invite=new URL(invite).searchParams.get('join')||'';}
    const course=await req<Course>('/api/courses/join',{method:'POST',body:JSON.stringify({code:invite})});
    await refresh();toast.success('Te uniste a la asignatura');navigate(`/asignaturas/${course.id}`);
  }catch(e:any){setError(e.message);}finally{setBusy(false);}};
  const create=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{
    const course=await req<Course>('/api/courses',{method:'POST',body:JSON.stringify(form)});await refresh();toast.success('Asignatura creada');navigate(`/asignaturas/${course.id}`);
  }catch(e:any){setError(e.message);}finally{setBusy(false);}};
  return <div className="content">
    <AcademicHead eyebrow="ENCONTRAR · ASIGNATURAS" title="Tus asignaturas." action={user.role==='Profesor'&&<button data-testid="create-course-button" className="btn btn-primary" onClick={()=>setCreating(!creating)}><Plus size={17}/>Crear asignatura</button>}/>
    <form className="join-course" onSubmit={join} data-testid="join-course-form"><label htmlFor="join-code">Unirse a una asignatura</label><div className="inline-form"><input id="join-code" data-testid="join-code-input" value={code} onChange={e=>setCode(e.target.value)} placeholder="Código o enlace de invitación" required maxLength={500}/><button className="btn btn-dark" data-testid="join-course-button" disabled={busy}>Unirme <ArrowRight size={16}/></button></div></form>
    <ErrorNotice error={error||loadError}/>
    {creating&&<form className="form course-form" onSubmit={create} data-testid="create-course-form"><h2>Nueva asignatura</h2><div className="field"><label htmlFor="course-name">Nombre</label><input id="course-name" data-testid="course-name-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} minLength={2} maxLength={100} required/></div><div className="field"><label htmlFor="course-code">Código académico</label><input id="course-code" data-testid="course-code-input" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} minLength={2} maxLength={30} required/></div><div className="field"><label htmlFor="course-description">Descripción</label><textarea id="course-description" data-testid="course-description-input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} maxLength={1000}/></div><div className="button-row"><button type="button" className="btn btn-light" data-testid="cancel-course-button" onClick={()=>setCreating(false)}>Cancelar</button><button className="btn btn-primary" data-testid="save-course-button" disabled={busy}>{busy?'Guardando…':'Crear'}</button></div></form>}
    {loading?<Loading/>:<section className="section"><div className="section-title"><h2>MIS ASIGNATURAS</h2><span className="muted" data-testid="course-count">{courses.length} en total</span></div>{courses.length?<div className="course-grid">{courses.map(c=><Link className="subject" data-testid={`course-card-${c.id}`} key={c.id} to={`/asignaturas/${c.id}`}><BookOpen size={22}/><div className="eyebrow">{c.code}</div><h3>{c.name}</h3><p className="muted">{c.description}</p><span className="tag" data-testid={`course-members-${c.id}`}>{c.member_ids.length} integrantes</span>{c.owner_id===user.user_id&&<span className="tag">Profesor responsable</span>}</Link>)}</div>:<Empty>Aún no perteneces a ninguna asignatura.</Empty>}</section>}
  </div>;
}