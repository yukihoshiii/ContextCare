import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {themeBootstrap} from '../src/lib/theme-bootstrap';
function resolveTheme(saved:string|null,systemDark:boolean,blocked=false,serverTheme?:string){
 const document={cookie:'',documentElement:{dataset:{...(serverTheme?{theme:serverTheme}:{})} as Record<string,string>}};
 runInNewContext(themeBootstrap,{document,localStorage:{getItem(){if(blocked)throw Error('Storage unavailable');return saved;}},window:{matchMedia(){return {matches:systemDark};}}});
 return document.documentElement.dataset.theme;
}
test('server theme persists through hydration even when local storage is stale or blocked',()=>{
 assert.equal(resolveTheme('light',false,false,'dark'),'dark');
 assert.equal(resolveTheme('dark',true,false,'light'),'light');
 assert.equal(resolveTheme(null,false,true,'dark'),'dark');
 assert.equal(resolveTheme('dark',false,false,'invalid'),'dark');
});
test('legacy local storage preference is migrated to a cookie for the next server render',()=>{
 const document={cookie:'',documentElement:{dataset:{} as Record<string,string>}};
 runInNewContext(themeBootstrap,{document,localStorage:{getItem(){return 'dark';}},window:{matchMedia(){return {matches:false};}}});
 assert.match(document.cookie,/^contextcare-theme=dark; Path=\/; Max-Age=31536000; SameSite=Lax$/);
});
test('saved theme is applied synchronously before hydration and takes priority over OS theme',()=>{
 assert.equal(resolveTheme('dark',false),'dark');assert.equal(resolveTheme('light',true),'light');
});
test('first visit and unavailable storage use the OS preference',()=>{
 assert.equal(resolveTheme(null,true),'dark');assert.equal(resolveTheme(null,false),'light');assert.equal(resolveTheme(null,true,true),'dark');
});
test('invalid storage values cannot become root attributes',()=>{
 assert.equal(resolveTheme('unexpected',true),'dark');assert.equal(resolveTheme('unexpected',false),'light');
});
