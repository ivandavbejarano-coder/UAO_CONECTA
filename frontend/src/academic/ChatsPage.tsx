import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, Users, UserRound } from 'lucide-react';
import { req, type AuthUser } from '../auth';
import { AcademicHead, Empty, ErrorNotice, Loading } from './UI';
import { colombiaTime } from './time';
import type { ChatMessage, ChatRoom } from './types';

export default function ChatsPage({user}:{user:AuthUser}) {
  const [params,setParams]=useSearchParams();const selected=params.get('room')||'';
  const [rooms,setRooms]=useState<ChatRoom[]>([]);const [messages,setMessages]=useState<ChatMessage[]>([]);
  const [text,setText]=useState('');const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [older,setOlder]=useState(false);
  const end=useRef<HTMLDivElement>(null);const current=useRef(selected);current.current=selected;
  useEffect(()=>{req<ChatRoom[]>('/api/chats').then(setRooms).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  useEffect(()=>{if(!selected){setMessages([]);return;}let active=true;setMessages([]);setText('');setError('');setLoading(true);
    const load=async(first=false)=>{try{const rows=await req<ChatMessage[]>(`/api/chats/${selected}/messages`);if(!active)return;setMessages(prev=>first?rows:[...new Map([...prev,...rows].map(m=>[m.id,m])).values()].sort((a,b)=>a.created_at.localeCompare(b.created_at)));if(first)setOlder(rows.length===50);setError('');}catch(e:any){if(active)setError(e.message);}finally{if(active)setLoading(false);}};
    load(true);const timer=setInterval(()=>{if(!document.hidden)load();},3000);return()=>{active=false;clearInterval(timer);};
  },[selected]);
  useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[messages.length]);
  const send=async(e:React.FormEvent)=>{e.preventDefault();if(!text.trim()||busy)return;const room=selected;setBusy(true);setError('');try{const msg=await req<ChatMessage>(`/api/chats/${room}/messages`,{method:'POST',body:JSON.stringify({text:text.trim()})});if(current.current===room){setMessages(prev=>[...new Map([...prev,msg].map(m=>[m.id,m])).values()]);setText('');}}catch(e:any){setError(e.message);}finally{setBusy(false);}};
  const previous=async()=>{try{const rows=await req<ChatMessage[]>(`/api/chats/${selected}/messages?before=${encodeURIComponent(messages[0].created_at)}`);setMessages(prev=>[...rows,...prev]);setOlder(rows.length===50);}catch(e:any){setError(e.message);}};
  const room=rooms.find(r=>r.id===selected);
  return <div className="content"><AcademicHead eyebrow="COORDINAR · CHATS" title="Conversaciones académicas."/><ErrorNotice error={error}/><div className="chat-workspace">
    <aside className="conversation-list" data-testid="chat-room-list"><h2>Tus conversaciones</h2>{rooms.length?rooms.map(r=><button key={r.id} data-testid={`chat-room-${r.id}`} className={`conversation-item ${selected===r.id?'active':''}`} onClick={()=>setParams({room:r.id})}>{r.kind==='course'?<Users size={17}/>:<UserRound size={17}/>}<span>{r.name}<small>{r.kind==='course'?'Asignatura':'Conversación privada'}</small></span></button>):!loading&&<Empty>No tienes chats todavía. <Link to="/asignaturas" data-testid="chats-join-link">Ir a asignaturas</Link></Empty>}</aside>
    <section className="conversation-main" data-testid="chat-conversation">{selected?<><header className="conversation-header"><MessageCircle size={20}/><div><h2 data-testid="chat-room-name">{room?.name||'Conversación'}</h2><small className="muted">{room?.kind==='direct'?'Privada · Integrantes de asignaturas comunes':'Chat de asignatura'}</small></div></header><div className="message-log" role="log" aria-live="polite" data-testid="chat-message-log">{loading?<Loading/>:messages.length===0?<Empty>Aún no hay mensajes.</Empty>:null}{older&&<button className="btn btn-light btn-small" data-testid="chat-load-older" onClick={previous}>Cargar anteriores</button>}{messages.map(m=><article key={m.id} className={`chat-bubble ${m.sender_id===user.user_id?'own':''}`} data-testid={`chat-message-${m.id}`}><div className="bubble-author">{m.sender_name}<span className="tag">{m.role}</span></div><p>{m.text}</p><time data-testid={`chat-time-${m.id}`}>{colombiaTime(m.created_at)} · COL</time></article>)}<div ref={end}/></div><form className="message-composer" onSubmit={send}><label className="sr-only" htmlFor="chat-text">Mensaje</label><textarea id="chat-text" data-testid="chat-message-input" value={text} onChange={e=>setText(e.target.value)} placeholder="Escribe un mensaje…" maxLength={4000} required/><button className="btn btn-dark" title="Enviar mensaje" data-testid="chat-send-button" disabled={busy||!text.trim()}><Send size={18}/><span className="sr-only">Enviar</span></button></form></>:<Empty><MessageCircle size={28}/><p>Selecciona una conversación.</p></Empty>}</section>
  </div></div>;
}