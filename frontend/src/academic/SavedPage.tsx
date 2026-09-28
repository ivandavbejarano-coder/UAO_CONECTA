import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { type AuthUser } from '../auth';
import { resources, initialQuestions, type Resource } from '../data';
import { useLocal } from './localStore';
import { AcademicHead, Empty } from './UI';
import { DoubtCard } from './DoubtsPages';
export default function SavedPage({user}:{user:AuthUser}) {
  const [ids,setIds]=useLocal<string[]>('uao-saved-questions',[],user.user_id);const [rids,setRids]=useLocal<string[]>('uao-saved-resources',[],user.user_id);const [questions]=useLocal('uao-questions',initialQuestions,user.user_id);const [custom]=useLocal<Resource[]>('uao-custom-resources',[],user.user_id);
  const qs=questions.filter(q=>ids.includes(q.id));const rs=[...custom,...resources].filter(r=>rids.includes(r.id));
  return <div className="content"><AcademicHead eyebrow="TU INFORMACIÓN" title="Guardados."/><section><h2>DUDAS GUARDADAS</h2>{qs.length?<div className="questions">{qs.map(q=><DoubtCard key={q.id} q={q} saved onSave={()=>{setIds(xs=>xs.filter(x=>x!==q.id));toast.success('Duda retirada de guardados');}}/>)}</div>:<Empty>Aún no tienes dudas guardadas.</Empty>}</section><section className="section"><h2>RECURSOS GUARDADOS</h2>{rs.length?<div className="resource-grid">{rs.map(r=><article className="resource" key={r.id} data-testid={`saved-resource-${r.id}`}><h3>{r.name}</h3><p>{r.description}</p><div className="button-row">{r.url?<a href={r.url} target="_blank" rel="noopener noreferrer" data-testid={`open-saved-resource-${r.id}`} className="btn btn-light btn-small">Abrir archivo</a>:<Link to="/grupo/archivos" className="btn btn-light btn-small" data-testid={`open-saved-resource-${r.id}`}>Ver recurso</Link>}<button className="btn btn-light btn-small" data-testid={`unsave-resource-${r.id}`} onClick={()=>{setRids(xs=>xs.filter(x=>x!==r.id));toast.success('Recurso retirado de guardados');}}><Bookmark size={15}/>Quitar</button></div></article>)}</div>:<Empty>Aún no tienes recursos guardados.</Empty>}</section></div>;
}