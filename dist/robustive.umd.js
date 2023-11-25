var I=(s,c,a)=>{if(!c.has(s))throw TypeError("Cannot "+a)};var i=(s,c,a)=>(I(s,c,"read from private field"),a?a.call(s):c.get(s)),m=(s,c,a)=>{if(c.has(s))throw TypeError("Cannot add the same private member more than once");c instanceof WeakSet?c.add(s):c.set(s,a)},R=(s,c,a,v)=>(I(s,c,"write to private field"),v?v.call(s,a):c.set(s,a),a);(function(s,c){typeof exports=="object"&&typeof module!="undefined"?c(exports):typeof define=="function"&&define.amd?define(["exports"],c):(s=typeof globalThis!="undefined"?globalThis:s||self,c(s.Robustive={}))})(this,function(s){var g,d,b,h;"use strict";class c{constructor(t=null){this.user=t}}class a extends c{}const v=u=>u.constructor===a,A=class{constructor(){return new Proxy(this,{get(t,e,n){switch(e){case"basics":case"alternatives":case"goals":return new Proxy({},{get(r,f,o){return typeof f=="string"&&!(f in r)?l=>Object.freeze({scene:f,course:e,...l}):Reflect.get(r,e,o)}});default:return Reflect.get(t,e,n)}}})}},x={success:"success",failure:"failure"},C=class{constructor(){return new Proxy(this,{get(t,e,n){return typeof e=="string"&&!(e in t)?r=>Object.freeze({type:e,...r}):Reflect.get(t,e,n)}})}},z=u=>{const t="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";return Array.from(crypto.getRandomValues(new Uint8Array(u))).map(e=>t[e%t.length]).join("")};class O{constructor(t,e,n,r){m(this,g,void 0);m(this,d,void 0);m(this,b,void 0);m(this,h,void 0);this.id=z(8),R(this,g,t),R(this,d,e),R(this,b,n),R(this,h,r)}interactedBy(t){const e=new Date,n=new C,r=o=>{const l=o.slice(-1)[0];return l.course==="goals"?Promise.resolve(o):i(this,h).next(l).then(y=>(o.push(y),r(o)))};if(i(this,h).authorize&&!i(this,h).authorize(t,i(this,g),i(this,d))){const o=new j(t.constructor.name,i(this,d));return Promise.reject(o)}const f=[i(this,b)];return r(f).then(o=>{const l=new Date,y=l.getTime()-e.getTime(),w=o.slice(-1)[0],T=n.success({id:this.id,actor:t,domain:i(this,g),usecase:i(this,d),startAt:e,endAt:l,elapsedTimeMs:y,performedScenario:o,lastSceneContext:w});return i(this,h).complete&&i(this,h).complete(T),T}).catch(o=>{console.error(o);const l=new Date,y=l.getTime()-e.getTime(),w=n.failure({id:this.id,actor:t,domain:i(this,g),usecase:i(this,d),startAt:e,endAt:l,elapsedTimeMs:y,error:o});return i(this,h).complete&&i(this,h).complete(w),w})}}g=new WeakMap,d=new WeakMap,b=new WeakMap,h=new WeakMap;const S=class{constructor(t,e,n,r){return new Proxy(this,{get(f,o,l){return typeof o=="string"&&!(o in f)?y=>{const w={scene:o,course:n,...y},T=new r,M=new O(t,e,w,T);return Object.freeze(Object.assign(M,{name:e,domain:t}))}:Reflect.get(f,o,l)}})}};class N{constructor(){const{basics:t,alternatives:e,goals:n}=new A;this.basics=t,this.alternatives=e,this.goals=n}just(t){return Promise.resolve(t)}}class B{constructor(t,e,n){this.basics=new S(t,e,"basics",n),this.alternatives=new S(t,e,"alternatives",n),this.goals=new S(t,e,"goals",n)}}const P=class{constructor(t,e){return new Proxy(this,{get(n,r,f){return typeof r=="string"&&!(r in n)?new B(t,r,e[r]):Reflect.get(n,r,f)}})}},U=class{constructor(t){return new Proxy(this,{get(e,n,r){return typeof n=="string"&&!(n in e)?new P(n,t[n]):Reflect.get(e,n,r)}})}};class j extends Error{constructor(t,e){super(`The actor "${t}" is not authorized to interact on usecase "${e}".`),Object.setPrototypeOf(this,new.target.prototype)}}s.ActorNotAuthorizedToInteractIn=j,s.BaseActor=c,s.BaseScenario=N,s.ContextSelector=A,s.InteractResultType=x,s.Nobody=a,s.Robustive=U,s.UsecaseSelector=P,s.isNobody=v,Object.defineProperties(s,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
