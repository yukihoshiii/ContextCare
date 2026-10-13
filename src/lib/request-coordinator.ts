// One active context per workspace. No patient payloads or responses are cached.
export class RequestCoordinator<T> {
 private active?:{key:string;controller:AbortController;promise:Promise<T>};
 run(key:string,load:(signal:AbortSignal)=>Promise<T>):Promise<T>{
  if(this.active?.key===key)return this.active.promise;
  this.cancel();
  const controller=new AbortController();
  const task={key,controller,promise:undefined as unknown as Promise<T>};
  task.promise=Promise.resolve().then(()=>load(controller.signal)).finally(()=>{if(this.active===task)this.active=undefined;});
  this.active=task;return task.promise;
 }
 cancel(){this.active?.controller.abort();this.active=undefined;}
}
