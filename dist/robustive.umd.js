(function(v,S){typeof exports=="object"&&typeof module!="undefined"?S(exports):typeof define=="function"&&define.amd?define(["exports"],S):(v=typeof globalThis!="undefined"?globalThis:v||self,S(v.Robustive={}))})(this,function(v){"use strict";class S{constructor(e=null){this.user=e}}class C extends S{}const vt=t=>t.constructor===C;var U=function(t,e){return U=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(n,r){n.__proto__=r}||function(n,r){for(var i in r)Object.prototype.hasOwnProperty.call(r,i)&&(n[i]=r[i])},U(t,e)};function j(t,e){if(typeof e!="function"&&e!==null)throw new TypeError("Class extends value "+String(e)+" is not a constructor or null");U(t,e);function n(){this.constructor=t}t.prototype=e===null?Object.create(e):(n.prototype=e.prototype,new n)}function pt(t,e,n,r){function i(o){return o instanceof n?o:new n(function(u){u(o)})}return new(n||(n=Promise))(function(o,u){function f(l){try{c(r.next(l))}catch(p){u(p)}}function a(l){try{c(r.throw(l))}catch(p){u(p)}}function c(l){l.done?o(l.value):i(l.value).then(f,a)}c((r=r.apply(t,e||[])).next())})}function Y(t,e){var n={label:0,sent:function(){if(o[0]&1)throw o[1];return o[1]},trys:[],ops:[]},r,i,o,u;return u={next:f(0),throw:f(1),return:f(2)},typeof Symbol=="function"&&(u[Symbol.iterator]=function(){return this}),u;function f(c){return function(l){return a([c,l])}}function a(c){if(r)throw new TypeError("Generator is already executing.");for(;u&&(u=0,c[0]&&(n=0)),n;)try{if(r=1,i&&(o=c[0]&2?i.return:c[0]?i.throw||((o=i.return)&&o.call(i),0):i.next)&&!(o=o.call(i,c[1])).done)return o;switch(i=0,o&&(c=[c[0]&2,o.value]),c[0]){case 0:case 1:o=c;break;case 4:return n.label++,{value:c[1],done:!1};case 5:n.label++,i=c[1],c=[0];continue;case 7:c=n.ops.pop(),n.trys.pop();continue;default:if(o=n.trys,!(o=o.length>0&&o[o.length-1])&&(c[0]===6||c[0]===2)){n=0;continue}if(c[0]===3&&(!o||c[1]>o[0]&&c[1]<o[3])){n.label=c[1];break}if(c[0]===6&&n.label<o[1]){n.label=o[1],o=c;break}if(o&&n.label<o[2]){n.label=o[2],n.ops.push(c);break}o[2]&&n.ops.pop(),n.trys.pop();continue}c=e.call(t,n)}catch(l){c=[6,l],i=0}finally{r=o=0}if(c[0]&5)throw c[1];return{value:c[0]?c[1]:void 0,done:!0}}}function x(t){var e=typeof Symbol=="function"&&Symbol.iterator,n=e&&t[e],r=0;if(n)return n.call(t);if(t&&typeof t.length=="number")return{next:function(){return t&&r>=t.length&&(t=void 0),{value:t&&t[r++],done:!t}}};throw new TypeError(e?"Object is not iterable.":"Symbol.iterator is not defined.")}function P(t,e){var n=typeof Symbol=="function"&&t[Symbol.iterator];if(!n)return t;var r=n.call(t),i,o=[],u;try{for(;(e===void 0||e-- >0)&&!(i=r.next()).done;)o.push(i.value)}catch(f){u={error:f}}finally{try{i&&!i.done&&(n=r.return)&&n.call(r)}finally{if(u)throw u.error}}return o}function _(t,e,n){if(n||arguments.length===2)for(var r=0,i=e.length,o;r<i;r++)(o||!(r in e))&&(o||(o=Array.prototype.slice.call(e,0,r)),o[r]=e[r]);return t.concat(o||Array.prototype.slice.call(e))}function g(t){return this instanceof g?(this.v=t,this):new g(t)}function mt(t,e,n){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var r=n.apply(t,e||[]),i,o=[];return i={},u("next"),u("throw"),u("return"),i[Symbol.asyncIterator]=function(){return this},i;function u(s){r[s]&&(i[s]=function(y){return new Promise(function(b,d){o.push([s,y,b,d])>1||f(s,y)})})}function f(s,y){try{a(r[s](y))}catch(b){p(o[0][3],b)}}function a(s){s.value instanceof g?Promise.resolve(s.value.v).then(c,l):p(o[0][2],s)}function c(s){f("next",s)}function l(s){f("throw",s)}function p(s,y){s(y),o.shift(),o.length&&f(o[0][0],o[0][1])}}function bt(t){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var e=t[Symbol.asyncIterator],n;return e?e.call(t):(t=typeof x=="function"?x(t):t[Symbol.iterator](),n={},r("next"),r("throw"),r("return"),n[Symbol.asyncIterator]=function(){return this},n);function r(o){n[o]=t[o]&&function(u){return new Promise(function(f,a){u=t[o](u),i(f,a,u.done,u.value)})}}function i(o,u,f,a){Promise.resolve(a).then(function(c){o({value:c,done:f})},u)}}function h(t){return typeof t=="function"}function wt(t){var e=function(r){Error.call(r),r.stack=new Error().stack},n=t(e);return n.prototype=Object.create(Error.prototype),n.prototype.constructor=n,n}var R=wt(function(t){return function(n){t(this),this.message=n?n.length+` errors occurred during unsubscription:
`+n.map(function(r,i){return i+1+") "+r.toString()}).join(`
  `):"",this.name="UnsubscriptionError",this.errors=n}});function G(t,e){if(t){var n=t.indexOf(e);0<=n&&t.splice(n,1)}}var L=function(){function t(e){this.initialTeardown=e,this.closed=!1,this._parentage=null,this._finalizers=null}return t.prototype.unsubscribe=function(){var e,n,r,i,o;if(!this.closed){this.closed=!0;var u=this._parentage;if(u)if(this._parentage=null,Array.isArray(u))try{for(var f=x(u),a=f.next();!a.done;a=f.next()){var c=a.value;c.remove(this)}}catch(d){e={error:d}}finally{try{a&&!a.done&&(n=f.return)&&n.call(f)}finally{if(e)throw e.error}}else u.remove(this);var l=this.initialTeardown;if(h(l))try{l()}catch(d){o=d instanceof R?d.errors:[d]}var p=this._finalizers;if(p){this._finalizers=null;try{for(var s=x(p),y=s.next();!y.done;y=s.next()){var b=y.value;try{H(b)}catch(d){o=o!=null?o:[],d instanceof R?o=_(_([],P(o)),P(d.errors)):o.push(d)}}}catch(d){r={error:d}}finally{try{y&&!y.done&&(i=s.return)&&i.call(s)}finally{if(r)throw r.error}}}if(o)throw new R(o)}},t.prototype.add=function(e){var n;if(e&&e!==this)if(this.closed)H(e);else{if(e instanceof t){if(e.closed||e._hasParent(this))return;e._addParent(this)}(this._finalizers=(n=this._finalizers)!==null&&n!==void 0?n:[]).push(e)}},t.prototype._hasParent=function(e){var n=this._parentage;return n===e||Array.isArray(n)&&n.includes(e)},t.prototype._addParent=function(e){var n=this._parentage;this._parentage=Array.isArray(n)?(n.push(e),n):n?[n,e]:e},t.prototype._removeParent=function(e){var n=this._parentage;n===e?this._parentage=null:Array.isArray(n)&&G(n,e)},t.prototype.remove=function(e){var n=this._finalizers;n&&G(n,e),e instanceof t&&e._removeParent(this)},t.EMPTY=function(){var e=new t;return e.closed=!0,e}(),t}();L.EMPTY;function B(t){return t instanceof L||t&&"closed"in t&&h(t.remove)&&h(t.add)&&h(t.unsubscribe)}function H(t){h(t)?t():t.unsubscribe()}var q={onUnhandledError:null,onStoppedNotification:null,Promise:void 0,useDeprecatedSynchronousErrorHandling:!1,useDeprecatedNextContext:!1},$={setTimeout:function(t,e){for(var n=[],r=2;r<arguments.length;r++)n[r-2]=arguments[r];var i=$.delegate;return i!=null&&i.setTimeout?i.setTimeout.apply(i,_([t,e],P(n))):setTimeout.apply(void 0,_([t,e],P(n)))},clearTimeout:function(t){var e=$.delegate;return((e==null?void 0:e.clearTimeout)||clearTimeout)(t)},delegate:void 0};function V(t){$.setTimeout(function(){throw t})}function J(){}function St(t){t()}var z=function(t){j(e,t);function e(n){var r=t.call(this)||this;return r.isStopped=!1,n?(r.destination=n,B(n)&&n.add(r)):r.destination=It,r}return e.create=function(n,r,i){return new F(n,r,i)},e.prototype.next=function(n){this.isStopped||this._next(n)},e.prototype.error=function(n){this.isStopped||(this.isStopped=!0,this._error(n))},e.prototype.complete=function(){this.isStopped||(this.isStopped=!0,this._complete())},e.prototype.unsubscribe=function(){this.closed||(this.isStopped=!0,t.prototype.unsubscribe.call(this),this.destination=null)},e.prototype._next=function(n){this.destination.next(n)},e.prototype._error=function(n){try{this.destination.error(n)}finally{this.unsubscribe()}},e.prototype._complete=function(){try{this.destination.complete()}finally{this.unsubscribe()}},e}(L),gt=Function.prototype.bind;function D(t,e){return gt.call(t,e)}var xt=function(){function t(e){this.partialObserver=e}return t.prototype.next=function(e){var n=this.partialObserver;if(n.next)try{n.next(e)}catch(r){O(r)}},t.prototype.error=function(e){var n=this.partialObserver;if(n.error)try{n.error(e)}catch(r){O(r)}else O(e)},t.prototype.complete=function(){var e=this.partialObserver;if(e.complete)try{e.complete()}catch(n){O(n)}},t}(),F=function(t){j(e,t);function e(n,r,i){var o=t.call(this)||this,u;if(h(n)||!n)u={next:n!=null?n:void 0,error:r!=null?r:void 0,complete:i!=null?i:void 0};else{var f;o&&q.useDeprecatedNextContext?(f=Object.create(n),f.unsubscribe=function(){return o.unsubscribe()},u={next:n.next&&D(n.next,f),error:n.error&&D(n.error,f),complete:n.complete&&D(n.complete,f)}):u=n}return o.destination=new xt(u),o}return e}(z);function O(t){V(t)}function At(t){throw t}var It={closed:!0,next:J,error:At,complete:J},M=function(){return typeof Symbol=="function"&&Symbol.observable||"@@observable"}();function K(t){return t}function Tt(t){return t.length===0?K:t.length===1?t[0]:function(n){return t.reduce(function(r,i){return i(r)},n)}}var m=function(){function t(e){e&&(this._subscribe=e)}return t.prototype.lift=function(e){var n=new t;return n.source=this,n.operator=e,n},t.prototype.subscribe=function(e,n,r){var i=this,o=Pt(e)?e:new F(e,n,r);return St(function(){var u=i,f=u.operator,a=u.source;o.add(f?f.call(o,a):a?i._subscribe(o):i._trySubscribe(o))}),o},t.prototype._trySubscribe=function(e){try{return this._subscribe(e)}catch(n){e.error(n)}},t.prototype.forEach=function(e,n){var r=this;return n=Q(n),new n(function(i,o){var u=new F({next:function(f){try{e(f)}catch(a){o(a),u.unsubscribe()}},error:o,complete:i});r.subscribe(u)})},t.prototype._subscribe=function(e){var n;return(n=this.source)===null||n===void 0?void 0:n.subscribe(e)},t.prototype[M]=function(){return this},t.prototype.pipe=function(){for(var e=[],n=0;n<arguments.length;n++)e[n]=arguments[n];return Tt(e)(this)},t.prototype.toPromise=function(e){var n=this;return e=Q(e),new e(function(r,i){var o;n.subscribe(function(u){return o=u},function(u){return i(u)},function(){return r(o)})})},t.create=function(e){return new t(e)},t}();function Q(t){var e;return(e=t!=null?t:q.Promise)!==null&&e!==void 0?e:Promise}function Et(t){return t&&h(t.next)&&h(t.error)&&h(t.complete)}function Pt(t){return t&&t instanceof z||Et(t)&&B(t)}function _t(t){return h(t==null?void 0:t.lift)}function A(t){return function(e){if(_t(e))return e.lift(function(n){try{return t(n,this)}catch(r){this.error(r)}});throw new TypeError("Unable to lift unknown Observable type")}}function I(t,e,n,r,i){return new Ot(t,e,n,r,i)}var Ot=function(t){j(e,t);function e(n,r,i,o,u,f){var a=t.call(this,n)||this;return a.onFinalize=u,a.shouldUnsubscribe=f,a._next=r?function(c){try{r(c)}catch(l){n.error(l)}}:t.prototype._next,a._error=o?function(c){try{o(c)}catch(l){n.error(l)}finally{this.unsubscribe()}}:t.prototype._error,a._complete=i?function(){try{i()}catch(c){n.error(c)}finally{this.unsubscribe()}}:t.prototype._complete,a}return e.prototype.unsubscribe=function(){var n;if(!this.shouldUnsubscribe||this.shouldUnsubscribe()){var r=this.closed;t.prototype.unsubscribe.call(this),!r&&((n=this.onFinalize)===null||n===void 0||n.call(this))}},e}(z);function kt(t){return t&&h(t.schedule)}function Ut(t){return t[t.length-1]}function jt(t){return kt(Ut(t))?t.pop():void 0}var W=function(t){return t&&typeof t.length=="number"&&typeof t!="function"};function X(t){return h(t==null?void 0:t.then)}function Z(t){return h(t[M])}function N(t){return Symbol.asyncIterator&&h(t==null?void 0:t[Symbol.asyncIterator])}function tt(t){return new TypeError("You provided "+(t!==null&&typeof t=="object"?"an invalid object":"'"+t+"'")+" where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.")}function Rt(){return typeof Symbol!="function"||!Symbol.iterator?"@@iterator":Symbol.iterator}var et=Rt();function nt(t){return h(t==null?void 0:t[et])}function rt(t){return mt(this,arguments,function(){var n,r,i,o;return Y(this,function(u){switch(u.label){case 0:n=t.getReader(),u.label=1;case 1:u.trys.push([1,,9,10]),u.label=2;case 2:return[4,g(n.read())];case 3:return r=u.sent(),i=r.value,o=r.done,o?[4,g(void 0)]:[3,5];case 4:return[2,u.sent()];case 5:return[4,g(i)];case 6:return[4,u.sent()];case 7:return u.sent(),[3,2];case 8:return[3,10];case 9:return n.releaseLock(),[7];case 10:return[2]}})})}function ot(t){return h(t==null?void 0:t.getReader)}function T(t){if(t instanceof m)return t;if(t!=null){if(Z(t))return Lt(t);if(W(t))return $t(t);if(X(t))return zt(t);if(N(t))return it(t);if(nt(t))return Dt(t);if(ot(t))return Ft(t)}throw tt(t)}function Lt(t){return new m(function(e){var n=t[M]();if(h(n.subscribe))return n.subscribe(e);throw new TypeError("Provided object does not correctly implement Symbol.observable")})}function $t(t){return new m(function(e){for(var n=0;n<t.length&&!e.closed;n++)e.next(t[n]);e.complete()})}function zt(t){return new m(function(e){t.then(function(n){e.closed||(e.next(n),e.complete())},function(n){return e.error(n)}).then(null,V)})}function Dt(t){return new m(function(e){var n,r;try{for(var i=x(t),o=i.next();!o.done;o=i.next()){var u=o.value;if(e.next(u),e.closed)return}}catch(f){n={error:f}}finally{try{o&&!o.done&&(r=i.return)&&r.call(i)}finally{if(n)throw n.error}}e.complete()})}function it(t){return new m(function(e){Mt(t,e).catch(function(n){return e.error(n)})})}function Ft(t){return it(rt(t))}function Mt(t,e){var n,r,i,o;return pt(this,void 0,void 0,function(){var u,f;return Y(this,function(a){switch(a.label){case 0:a.trys.push([0,5,6,11]),n=bt(t),a.label=1;case 1:return[4,n.next()];case 2:if(r=a.sent(),!!r.done)return[3,4];if(u=r.value,e.next(u),e.closed)return[2];a.label=3;case 3:return[3,1];case 4:return[3,11];case 5:return f=a.sent(),i={error:f},[3,11];case 6:return a.trys.push([6,,9,10]),r&&!r.done&&(o=n.return)?[4,o.call(n)]:[3,8];case 7:a.sent(),a.label=8;case 8:return[3,10];case 9:if(i)throw i.error;return[7];case 10:return[7];case 11:return e.complete(),[2]}})})}function w(t,e,n,r,i){r===void 0&&(r=0),i===void 0&&(i=!1);var o=e.schedule(function(){n(),i?t.add(this.schedule(null,r)):this.unsubscribe()},r);if(t.add(o),!i)return o}function ut(t,e){return e===void 0&&(e=0),A(function(n,r){n.subscribe(I(r,function(i){return w(r,t,function(){return r.next(i)},e)},function(){return w(r,t,function(){return r.complete()},e)},function(i){return w(r,t,function(){return r.error(i)},e)}))})}function ct(t,e){return e===void 0&&(e=0),A(function(n,r){r.add(t.schedule(function(){return n.subscribe(r)},e))})}function Ct(t,e){return T(t).pipe(ct(e),ut(e))}function Yt(t,e){return T(t).pipe(ct(e),ut(e))}function Gt(t,e){return new m(function(n){var r=0;return e.schedule(function(){r===t.length?n.complete():(n.next(t[r++]),n.closed||this.schedule())})})}function Bt(t,e){return new m(function(n){var r;return w(n,e,function(){r=t[et](),w(n,e,function(){var i,o,u;try{i=r.next(),o=i.value,u=i.done}catch(f){n.error(f);return}u?n.complete():n.next(o)},0,!0)}),function(){return h(r==null?void 0:r.return)&&r.return()}})}function at(t,e){if(!t)throw new Error("Iterable cannot be null");return new m(function(n){w(n,e,function(){var r=t[Symbol.asyncIterator]();w(n,e,function(){r.next().then(function(i){i.done?n.complete():n.next(i.value)})},0,!0)})})}function Ht(t,e){return at(rt(t),e)}function qt(t,e){if(t!=null){if(Z(t))return Ct(t,e);if(W(t))return Gt(t,e);if(X(t))return Yt(t,e);if(N(t))return at(t,e);if(nt(t))return Bt(t,e);if(ot(t))return Ht(t,e)}throw tt(t)}function Vt(t,e){return e?qt(t,e):T(t)}function ft(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];var n=jt(t);return Vt(t,n)}function Jt(t,e){var n=h(t)?t:function(){return t},r=function(i){return i.error(n())};return new m(e?function(i){return e.schedule(r,0,i)}:r)}function st(t,e){return A(function(n,r){var i=0;n.subscribe(I(r,function(o){r.next(t.call(e,o,i++))}))})}function Kt(t,e,n,r,i,o,u,f){var a=[],c=0,l=0,p=!1,s=function(){p&&!a.length&&!c&&e.complete()},y=function(d){return c<r?b(d):a.push(d)},b=function(d){o&&e.next(d),c++;var yt=!1;T(n(d,l++)).subscribe(I(e,function(E){i==null||i(E),o?y(E):e.next(E)},function(){yt=!0},void 0,function(){if(yt)try{c--;for(var E=function(){var k=a.shift();u?w(e,u,function(){return b(k)}):b(k)};a.length&&c<r;)E();s()}catch(k){e.error(k)}}))};return t.subscribe(I(e,y,function(){p=!0,s()})),function(){f==null||f()}}function lt(t,e,n){return n===void 0&&(n=1/0),h(e)?lt(function(r,i){return st(function(o,u){return e(r,o,i,u)})(T(t(r,i)))},n):(typeof e=="number"&&(n=e),A(function(r,i){return Kt(r,i,t,n)}))}function Qt(t,e,n){var r=h(t)||e||n?{next:t,error:e,complete:n}:t;return r?A(function(i,o){var u;(u=r.subscribe)===null||u===void 0||u.call(r);var f=!0;i.subscribe(I(o,function(a){var c;(c=r.next)===null||c===void 0||c.call(r,a),o.next(a)},function(){var a;f=!1,(a=r.complete)===null||a===void 0||a.call(r),o.complete()},function(a){var c;f=!1,(c=r.error)===null||c===void 0||c.call(r,a),o.error(a)},function(){var a,c;f&&((a=r.unsubscribe)===null||a===void 0||a.call(r)),(c=r.finalize)===null||c===void 0||c.call(r)}))}):K}const Wt=null;class Xt{constructor(e){this.context=e}instantiate(e){return new this.constructor(e)}just(e){return ft(this.instantiate(e))}authorize(e){throw new dt(this,e)}interactedBy(e,n){if(n){let r=null;return r=this.interactedBy(e).subscribe({next:i=>{var u;const o=i.slice(-1)[0];(u=n.next)==null||u.call(n,[o,i])},error:i=>{var o;console.error(i),(o=n.error)==null||o.call(n,i)},complete:()=>{var i;r==null||r.unsubscribe(),(i=n.complete)==null||i.call(n)}}),r}else{const r=new Date,i=u=>{const a=u.slice(-1)[0].next();return a?a.pipe(lt(c=>(u.push(c),i(u)))):ft(u)};if(!this.authorize(e)){const u=new ht(e.constructor.name,this.constructor.name);return Jt(()=>u)}return i([this]).pipe(st(u=>u.map(a=>a.context)),Qt(u=>{const f=new Date().getTime()-r.getTime();console.info(`${this.constructor.name} takes ${f} ms.`,u)}))}}}class ht extends Error{constructor(e,n){super(`The actor "${e}" is not authorized to interact in ${n}`),Object.setPrototypeOf(this,new.target.prototype)}}class dt extends Error{constructor(e,n){super(`Authorizing ${n.constructor.name} to ${e.constructor.name} is not defined. Please override authorize() at ${e.constructor.name}.`),Object.setPrototypeOf(this,new.target.prototype)}}v.ActorNotAuthorizedToInteractIn=ht,v.AuthorizingIsNotDefinedForThisActor=dt,v.BaseActor=S,v.Nobody=C,v.Usecase=Xt,v.boundary=Wt,v.isNobody=vt,Object.defineProperties(v,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
