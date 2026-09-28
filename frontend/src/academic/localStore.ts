import { useEffect, useState } from 'react';
import type { AcademicEvent } from './types';
export function useLocal<T>(key:string, initial:T, userId:string) {
  const scoped=`${userId}:${key}`;
  const [value,setValue]=useState<T>(()=>{try {
    const saved=localStorage.getItem(scoped);if(saved)return JSON.parse(saved);
    const owner=localStorage.getItem('uao-legacy-owner');
    if(!owner)localStorage.setItem('uao-legacy-owner',userId);
    const legacy=(!owner||owner===userId)&&localStorage.getItem(key);
    return legacy?JSON.parse(legacy):initial;
  }catch{return initial;}});
  useEffect(()=>{localStorage.setItem(scoped,JSON.stringify(value));window.dispatchEvent(new CustomEvent('uao-storage',{detail:scoped}));},[scoped,value]);
  useEffect(()=>{const update=(e:Event)=>{if(e instanceof CustomEvent&&e.detail!==scoped)return;const saved=localStorage.getItem(scoped);if(saved)setValue(prev=>JSON.stringify(prev)===saved?prev:JSON.parse(saved));};window.addEventListener('storage',update);window.addEventListener('uao-storage',update);return()=>{window.removeEventListener('storage',update);window.removeEventListener('uao-storage',update);};},[scoped]);
  return [value,setValue] as const;
}
export function recordActivity(userId:string,text:string,path:string) {
  const key=`${userId}:uao-events`;
  const items:AcademicEvent[]=JSON.parse(localStorage.getItem(key)||'[]');
  localStorage.setItem(key,JSON.stringify([{id:crypto.randomUUID(),text,path,created_at:new Date().toISOString(),read:false},...items].slice(0,300)));
  window.dispatchEvent(new CustomEvent('uao-storage',{detail:key}));
}