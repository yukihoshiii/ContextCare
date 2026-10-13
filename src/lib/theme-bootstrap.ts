// Static, synchronous head script: resolve the theme before the body can paint.
export const themeBootstrap = `(function(){
  var serverTheme=document.documentElement.dataset.theme;
  var saved=null;
  try{saved=localStorage.getItem('contextcare-theme');}catch(e){}
  var theme=serverTheme==='dark'||serverTheme==='light'?serverTheme:saved==='dark'||saved==='light'?saved:null;
  if(!theme){try{theme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}catch(e){theme='light';}}
  document.documentElement.dataset.theme=theme;
  try{document.cookie='contextcare-theme='+theme+'; Path=/; Max-Age=31536000; SameSite=Lax';}catch(e){}
})();`;
