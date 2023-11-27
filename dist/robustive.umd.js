var P=(n,c,a)=>{if(!c.has(n))throw TypeError("Cannot "+a)};var o=(n,c,a)=>(P(n,c,"read from private field"),a?a.call(n):c.get(n)),b=(n,c,a)=>{if(c.has(n))throw TypeError("Cannot add the same private member more than once");c instanceof WeakSet?c.add(n):c.set(n,a)},R=(n,c,a,S)=>(P(n,c,"write to private field"),S?S.call(n,a):c.set(n,a),a);(function(n,c){typeof exports=="object"&&typeof module!="undefined"?c(exports):typeof define=="function"&&define.amd?define(["exports"],c):(n=typeof globalThis!="undefined"?globalThis:n||self,c(n.Robustive={}))})(this,function(n){var d,f,w,l;"use strict";class c{constructor(e=null){this.user=e}}class a extends c{}const S=u=>u.constructor===a,v=class{constructor(e){return new Proxy(this,{get(t,s,r){return typeof s=="string"&&!(s in t)?y=>Object.freeze({scene:s,course:e,...y}):Reflect.get(t,s,r)}})}},z={success:"success",failure:"failure"},U=class{constructor(){return new Proxy(this,{get(e,t,s){return typeof t=="string"&&!(t in e)?r=>Object.freeze({type:t,...r}):Reflect.get(e,t,s)}})}},x=u=>{const e="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";return Array.from(crypto.getRandomValues(new Uint8Array(u))).map(t=>e[t%e.length]).join("")};class F{constructor(e,t,s,r){b(this,d,void 0);b(this,f,void 0);b(this,w,void 0);b(this,l,void 0);this.id=x(8),R(this,d,e),R(this,f,t),R(this,w,s),R(this,l,r)}interactedBy(e){const t=new Date,s=new U,r=i=>{const h=i.slice(-1)[0];return h.course==="goals"?Promise.resolve(i):o(this,l).next(h).then(g=>(i.push(g),r(i)))};if(o(this,l).authorize&&!o(this,l).authorize(e,o(this,d),o(this,f))){const i=new j(e,o(this,d),o(this,f));return Promise.reject(i)}const y=[o(this,w)];return r(y).then(i=>{const h=new Date,g=h.getTime()-t.getTime(),m=i.slice(-1)[0],T=s.success({id:this.id,actor:e,domain:o(this,d),usecase:o(this,f),startAt:t,endAt:h,elapsedTimeMs:g,performedScenario:i,lastSceneContext:m});return o(this,l).complete&&o(this,l).complete(T),T}).catch(i=>{console.error(i);const h=new Date,g=h.getTime()-t.getTime(),m=s.failure({id:this.id,actor:e,domain:o(this,d),usecase:o(this,f),startAt:t,endAt:h,elapsedTimeMs:g,error:i});return o(this,l).complete&&o(this,l).complete(m),m})}}d=new WeakMap,f=new WeakMap,w=new WeakMap,l=new WeakMap;const A=class{constructor(e,t,s,r){return new Proxy(this,{get(y,i,h){return typeof i=="string"&&!(i in y)?g=>{const m={scene:i,course:s,...g},T=new r,C=new F(e,t,m,T);return Object.freeze(Object.assign(C,{name:t,domain:e}))}:Reflect.get(y,i,h)}})}};class N{constructor(e,t,s){this.basics=new A(e,t,"basics",s),this.alternatives=new A(e,t,"alternatives",s),this.goals=new A(e,t,"goals",s)}}class B{constructor(){this.basics=new v("basics"),this.alternatives=new v("alternatives"),this.goals=new v("goals")}just(e){return Promise.resolve(e)}}const I=class{constructor(e,t){return new Proxy(this,{get(s,r,y){return typeof r=="string"&&!(r in s)?new N(e,r,t[r]):Reflect.get(s,r,y)}})}},O=class{constructor(e){return new Proxy(this,{get(t,s,r){return typeof s=="string"&&!(s in t)?new I(s,e[s]):Reflect.get(t,s,r)}})}};class j extends Error{constructor(e,t,s){super(`The actor "${e.constructor.name}" is not authorized to interact on usecase "${String(s)}" of domain "${String(t)}".`)}}n.ActorNotAuthorizedToInteractIn=j,n.BaseActor=c,n.BaseScenario=B,n.InteractResultType=z,n.Nobody=a,n.Robustive=O,n.UsecaseSelector=I,n.isNobody=S,Object.defineProperties(n,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
