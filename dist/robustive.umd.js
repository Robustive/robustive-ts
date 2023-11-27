var P=(n,c,a)=>{if(!c.has(n))throw TypeError("Cannot "+a)};var i=(n,c,a)=>(P(n,c,"read from private field"),a?a.call(n):c.get(n)),b=(n,c,a)=>{if(c.has(n))throw TypeError("Cannot add the same private member more than once");c instanceof WeakSet?c.add(n):c.set(n,a)},R=(n,c,a,S)=>(P(n,c,"write to private field"),S?S.call(n,a):c.set(n,a),a);(function(n,c){typeof exports=="object"&&typeof module!="undefined"?c(exports):typeof define=="function"&&define.amd?define(["exports"],c):(n=typeof globalThis!="undefined"?globalThis:n||self,c(n.Robustive={}))})(this,function(n){var d,f,m,l;"use strict";class c{constructor(t=null){this.user=t}}class a extends c{}const S=u=>u.constructor===a,T=class{constructor(t){return new Proxy({},{get(e,s,r){return typeof s=="string"&&!(s in e)?g=>Object.freeze({scene:s,course:t,...g}):Reflect.get(e,s,r)}})}},A=class{constructor(){return new Proxy(this,{get(t,e,s){switch(e){case"basics":return new T(e);case"alternatives":return new T(e);case"goals":return new T(e);default:return Reflect.get(t,e,s)}}})}},j={success:"success",failure:"failure"},z=class{constructor(){return new Proxy(this,{get(t,e,s){return typeof e=="string"&&!(e in t)?r=>Object.freeze({type:e,...r}):Reflect.get(t,e,s)}})}},N=u=>{const t="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";return Array.from(crypto.getRandomValues(new Uint8Array(u))).map(e=>t[e%t.length]).join("")};class B{constructor(t,e,s,r){b(this,d,void 0);b(this,f,void 0);b(this,m,void 0);b(this,l,void 0);this.id=N(8),R(this,d,t),R(this,f,e),R(this,m,s),R(this,l,r)}interactedBy(t){const e=new Date,s=new z,r=o=>{const h=o.slice(-1)[0];return h.course==="goals"?Promise.resolve(o):i(this,l).next(h).then(y=>(o.push(y),r(o)))};if(i(this,l).authorize&&!i(this,l).authorize(t,i(this,d),i(this,f))){const o=new I(t,i(this,d),i(this,f));return Promise.reject(o)}const g=[i(this,m)];return r(g).then(o=>{const h=new Date,y=h.getTime()-e.getTime(),w=o.slice(-1)[0],v=s.success({id:this.id,actor:t,domain:i(this,d),usecase:i(this,f),startAt:e,endAt:h,elapsedTimeMs:y,performedScenario:o,lastSceneContext:w});return i(this,l).complete&&i(this,l).complete(v),v}).catch(o=>{console.error(o);const h=new Date,y=h.getTime()-e.getTime(),w=s.failure({id:this.id,actor:t,domain:i(this,d),usecase:i(this,f),startAt:e,endAt:h,elapsedTimeMs:y,error:o});return i(this,l).complete&&i(this,l).complete(w),w})}}d=new WeakMap,f=new WeakMap,m=new WeakMap,l=new WeakMap;const x=class{constructor(t,e,s,r){return new Proxy(this,{get(g,o,h){return typeof o=="string"&&!(o in g)?y=>{const w={scene:o,course:s,...y},v=new r,D=new B(t,e,w,v);return Object.freeze(Object.assign(D,{name:e,domain:t}))}:Reflect.get(g,o,h)}})}};class O{constructor(){const{basics:t,alternatives:e,goals:s}=new A;this.basics=t,this.alternatives=e,this.goals=s}just(t){return Promise.resolve(t)}}class U{constructor(t,e,s){this.basics=new x(t,e,"basics",s),this.alternatives=new x(t,e,"alternatives",s),this.goals=new x(t,e,"goals",s)}}const C=class{constructor(t,e){return new Proxy(this,{get(s,r,g){return typeof r=="string"&&!(r in s)?new U(t,r,e[r]):Reflect.get(s,r,g)}})}},M=class{constructor(t){return new Proxy(this,{get(e,s,r){return typeof s=="string"&&!(s in e)?new C(s,t[s]):Reflect.get(e,s,r)}})}};class I extends Error{constructor(t,e,s){super(`The actor "${t.constructor.name}" is not authorized to interact on usecase "${String(s)}" of domain "${String(e)}".`)}}n.ActorNotAuthorizedToInteractIn=I,n.BaseActor=c,n.BaseScenario=O,n.ContextSelector=A,n.InteractResultType=j,n.Nobody=a,n.Robustive=M,n.UsecaseSelector=C,n.isNobody=S,Object.defineProperties(n,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
