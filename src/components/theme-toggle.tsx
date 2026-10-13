'use client';
import {useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';
export function ThemeToggle(){
 const [dark,setDark]=useState(false);
 useEffect(()=>{setDark(document.documentElement.dataset.theme==='dark');},[]);
 function toggle(){const next=document.documentElement.dataset.theme!=='dark';const theme=next?'dark':'light';setDark(next);document.documentElement.dataset.theme=theme;document.cookie='contextcare-theme='+theme+'; Path=/; Max-Age=31536000; SameSite=Lax';try{localStorage.setItem('contextcare-theme',theme);}catch{}}
 return <button className="theme-toggle" aria-label={dark?'Switch to light theme':'Switch to dark theme'} onClick={toggle}>{dark?<Sun size={17}/>:<Moon size={17}/>}<span>{dark?'Light':'Dark'}</span></button>;
}
