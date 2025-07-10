(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[77],{2916:function(e,t,a){(window.__NEXT_P=window.__NEXT_P||[]).push(["/admin/minha-conta",function(){return a(3923)}])},3923:function(e,t,a){"use strict";a.r(t),a.d(t,{default:function(){return u}});var r=a(5893),o=a(7294),s=a(5150),i=a(6501),n=a(1664),l=a.n(n);let d=o.forwardRef(function(e,t){let{title:a,titleId:r,...s}=e;return o.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:1.5,stroke:"currentColor","aria-hidden":"true","data-slot":"icon",ref:t,"aria-labelledby":r},s),a?o.createElement("title",{id:r},a):null,o.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"}))});function c(){let[e,t]=(0,o.useState)(null),[a,n]=(0,o.useState)({nome:"",telefone:""}),[c,u]=(0,o.useState)(!0),[p,m]=(0,o.useState)(!1),[f,g]=(0,o.useState)(""),[b,h]=(0,o.useState)(""),[y,x]=(0,o.useState)(null);async function v(){u(!0),await s.O.from("users_profiles").upsert({id:e.id,...a}),await s.O.auth.updateUser({data:a}),await s.O.from("users").update({nome:a.nome,telefone:a.telefone}).eq("id",e.id),i.Am.success("Perfil salvo!"),u(!1)}async function w(){if(!f||f!==b){i.Am.error("As senhas n\xe3o coincidem");return}await s.O.auth.updateUser({password:f}),i.Am.success("Senha alterada — fa\xe7a login novamente"),location.href="/login"}async function j(){await s.O.auth.signOut({scope:"global"}),location.href="/login"}return((0,o.useEffect)(()=>{(async()=>{var e,a,r,o;let{data:{user:i}}=await s.O.auth.getUser();t(i),x(null!==(a=null==i?void 0:null===(e=i.user_metadata)||void 0===e?void 0:e.avatar_url)&&void 0!==a?a:null);let{data:l}=await s.O.from("users_profiles").select("nome, telefone").eq("id",i.id).single();l?n(l):i.user_metadata&&n({nome:null!==(r=i.user_metadata.nome)&&void 0!==r?r:"",telefone:null!==(o=i.user_metadata.telefone)&&void 0!==o?o:""}),u(!1)})()},[]),c)?(0,r.jsx)("p",{className:"text-center py-10",children:"Carregando…"}):(0,r.jsxs)("div",{className:"max-w-xl w-full px-4 mx-auto bg-gradient-to-br from-white via-slate-50 to-slate-100 rounded-2xl shadow-xl ring-1 ring-black/5 px-8 py-14 space-y-8 sm:space-y-10",children:[(0,r.jsxs)("header",{className:"flex items-center justify-between mb-2",children:[(0,r.jsx)("h1",{className:"text-3xl font-bold text-gray-900 tracking-tight",children:"Minha Conta"}),(0,r.jsxs)(l(),{href:"/admin/dashboard",className:"btn-secondary flex items-center gap-2 !px-5 !py-2 text-base",children:[(0,r.jsx)(d,{className:"w-5 h-5"})," Voltar"]})]}),(0,r.jsx)("hr",{className:"border-gray-100 mb-2"}),(0,r.jsxs)("section",{children:[(0,r.jsx)("h2",{className:"text-lg font-semibold text-gray-800 mb-4",children:"Perfil"}),(0,r.jsxs)("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-8",children:[(0,r.jsxs)("label",{className:"block font-medium mb-1 text-gray-700",children:["Nome completo",(0,r.jsx)("input",{className:"w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition",value:a.nome,onChange:e=>n({...a,nome:e.target.value}),placeholder:"Digite seu nome completo",disabled:c})]}),(0,r.jsxs)("label",{className:"block font-medium mb-1 text-gray-700",children:["Telefone",(0,r.jsx)("input",{className:"w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition",value:a.telefone,onChange:e=>n({...a,telefone:e.target.value}),placeholder:"(48) 99999-1234",disabled:c})]}),(0,r.jsxs)("label",{className:"block font-medium mb-1 text-gray-700 col-span-full",children:["E-mail",(0,r.jsx)("input",{className:"w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 mt-1",disabled:!0,value:e.email})]})]}),(0,r.jsx)("div",{className:"flex justify-end mt-6",children:(0,r.jsx)("button",{onClick:v,className:"bg-primary text-white font-semibold py-2 px-6 rounded-lg shadow hover:bg-primary2 transition disabled:opacity-60 ml-auto","aria-label":"Salvar perfil",disabled:c,children:"Salvar"})})]}),(0,r.jsxs)("section",{className:"space-y-4",children:[(0,r.jsx)("h2",{className:"text-lg font-semibold text-gray-800",children:"Seguran\xe7a"}),(0,r.jsxs)("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-8",children:[(0,r.jsx)("input",{type:"password",className:"w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition",placeholder:"Nova senha",value:f,onChange:e=>g(e.target.value),disabled:c}),(0,r.jsx)("input",{type:"password",className:"w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition",placeholder:"Confirmar nova senha",value:b,onChange:e=>h(e.target.value),disabled:c})]}),(0,r.jsxs)("div",{className:"flex flex-wrap gap-4 mt-6",children:[(0,r.jsx)("button",{onClick:w,className:"bg-primary text-white font-semibold py-2 px-6 rounded-lg shadow hover:bg-primary2 transition disabled:opacity-60","aria-label":"Alterar senha",disabled:c,children:"Alterar senha"}),(0,r.jsx)("button",{onClick:j,className:"bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg hover:bg-gray-400 transition disabled:opacity-60","aria-label":"Sair de todos os dispositivos",disabled:c,children:"Sair de todos os dispositivos"})]})]})]})}function u(){return(0,r.jsx)(c,{})}},5150:function(e,t,a){"use strict";a.d(t,{O:function(){return r}});let r=(0,a(6844).eI)("https://elcbodhxzvoqpzamgown.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw")},6501:function(e,t,a){"use strict";let r,o;a.d(t,{Am:function(){return z}});var s,i=a(7294);let n={data:""},l=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||n,d=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,c=/\/\*[^]*?\*\/|  +/g,u=/\n+/g,p=(e,t)=>{let a="",r="",o="";for(let s in e){let i=e[s];"@"==s[0]?"i"==s[1]?a=s+" "+i+";":r+="f"==s[1]?p(i,s):s+"{"+p(i,"k"==s[1]?"":t)+"}":"object"==typeof i?r+=p(i,t?t.replace(/([^,])+/g,e=>s.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):s):null!=i&&(s=/^--/.test(s)?s:s.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=p.p?p.p(s,i):s+":"+i+";")}return a+(t&&o?t+"{"+o+"}":o)+r},m={},f=e=>{if("object"==typeof e){let t="";for(let a in e)t+=a+f(e[a]);return t}return e},g=(e,t,a,r,o)=>{var s;let i=f(e),n=m[i]||(m[i]=(e=>{let t=0,a=11;for(;t<e.length;)a=101*a+e.charCodeAt(t++)>>>0;return"go"+a})(i));if(!m[n]){let t=i!==e?e:(e=>{let t,a,r=[{}];for(;t=d.exec(e.replace(c,""));)t[4]?r.shift():t[3]?(a=t[3].replace(u," ").trim(),r.unshift(r[0][a]=r[0][a]||{})):r[0][t[1]]=t[2].replace(u," ").trim();return r[0]})(e);m[n]=p(o?{["@keyframes "+n]:t}:t,a?"":"."+n)}let l=a&&m.g?m.g:null;return a&&(m.g=m[n]),s=m[n],l?t.data=t.data.replace(l,s):-1===t.data.indexOf(s)&&(t.data=r?s+t.data:t.data+s),n},b=(e,t,a)=>e.reduce((e,r,o)=>{let s=t[o];if(s&&s.call){let e=s(a),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;s=t?"."+t:e&&"object"==typeof e?e.props?"":p(e,""):!1===e?"":e}return e+r+(null==s?"":s)},"");function h(e){let t=this||{},a=e.call?e(t.p):e;return g(a.unshift?a.raw?b(a,[].slice.call(arguments,1),t.p):a.reduce((e,a)=>Object.assign(e,a&&a.call?a(t.p):a),{}):a,l(t.target),t.g,t.o,t.k)}h.bind({g:1});let y,x,v,w=h.bind({k:1});function j(e,t){let a=this||{};return function(){let r=arguments;function o(s,i){let n=Object.assign({},s),l=n.className||o.className;a.p=Object.assign({theme:x&&x()},n),a.o=/ *go\d+/.test(l),n.className=h.apply(a,r)+(l?" "+l:""),t&&(n.ref=i);let d=e;return e[0]&&(d=n.as||e,delete n.as),v&&d[0]&&v(n),y(d,n)}return t?t(o):o}}var N=e=>"function"==typeof e,k=(e,t)=>N(e)?e(t):e,E=(r=0,()=>(++r).toString()),C=()=>{if(void 0===o&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");o=!e||e.matches}return o},_=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:a}=t;return _(e,{type:e.toasts.find(e=>e.id===a.id)?1:0,toast:a});case 3:let{toastId:r}=t;return{...e,toasts:e.toasts.map(e=>e.id===r||void 0===r?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+o}))}}},I=[],O={toasts:[],pausedAt:void 0},S=e=>{O=_(O,e),I.forEach(e=>{e(O)})},$=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(null==a?void 0:a.id)||E()}),A=e=>(t,a)=>{let r=$(t,e,a);return S({type:2,toast:r}),r.id},z=(e,t)=>A("blank")(e,t);z.error=A("error"),z.success=A("success"),z.loading=A("loading"),z.custom=A("custom"),z.dismiss=e=>{S({type:3,toastId:e})},z.remove=e=>S({type:4,toastId:e}),z.promise=(e,t,a)=>{let r=z.loading(t.loading,{...a,...null==a?void 0:a.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let o=t.success?k(t.success,e):void 0;return o?z.success(o,{id:r,...a,...null==a?void 0:a.success}):z.dismiss(r),e}).catch(e=>{let o=t.error?k(t.error,e):void 0;o?z.error(o,{id:r,...a,...null==a?void 0:a.error}):z.dismiss(r)}),e};var M=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,D=w`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,J=w`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,q=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${M} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${D} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${J} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,F=w`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,L=j("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${F} 1s linear infinite;
`,P=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,T=w`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Z=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${P} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${T} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,X=j("div")`
  position: absolute;
`,B=j("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,R=w`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,U=j("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${R} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,V=({toast:e})=>{let{icon:t,type:a,iconTheme:r}=e;return void 0!==t?"string"==typeof t?i.createElement(U,null,t):t:"blank"===a?null:i.createElement(B,null,i.createElement(L,{...r}),"loading"!==a&&i.createElement(X,null,"error"===a?i.createElement(q,{...r}):i.createElement(Z,{...r})))},W=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Y=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,G=j("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Q=j("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,H=(e,t)=>{let a=e.includes("top")?1:-1,[r,o]=C()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[W(a),Y(a)];return{animation:t?`${w(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};i.memo(({toast:e,position:t,style:a,children:r})=>{let o=e.height?H(e.position||t||"top-center",e.visible):{opacity:0},s=i.createElement(V,{toast:e}),n=i.createElement(Q,{...e.ariaProps},k(e.message,e));return i.createElement(G,{className:e.className,style:{...o,...a,...e.style}},"function"==typeof r?r({icon:s,message:n}):i.createElement(i.Fragment,null,s,n))}),s=i.createElement,p.p=void 0,y=s,x=void 0,v=void 0,h`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`}},function(e){e.O(0,[844,664,888,774,179],function(){return e(e.s=2916)}),_N_E=e.O()}]);