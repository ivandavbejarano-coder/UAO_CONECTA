import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { req } from '../auth';
import type { AcademicEvent, Course } from './types';

const Context = createContext<{courses:Course[]; events:AcademicEvent[]; loading:boolean; error:string; refresh:()=>Promise<void>}>({courses:[],events:[],loading:true,error:'',refresh:async()=>{}});
export const useAcademic = () => useContext(Context);
export const AcademicProvider = ({children}:{children:React.ReactNode}) => {
  const [courses,setCourses]=useState<Course[]>([]);
  const [events,setEvents]=useState<AcademicEvent[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const refresh=useCallback(async()=>{
    try { const [cs,es]=await Promise.all([req<Course[]>('/api/courses'),req<AcademicEvent[]>('/api/events')]);setCourses(cs);setEvents(es);setError(''); }
    catch(e:any){setError(e.message || 'No pudimos cargar tu espacio académico');}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{refresh(); const update=()=>{if(!document.hidden) refresh();}; window.addEventListener('focus',update); return ()=>window.removeEventListener('focus',update);},[refresh]);
  return <Context.Provider value={{courses,events,loading,error,refresh}}>{children}</Context.Provider>;
};