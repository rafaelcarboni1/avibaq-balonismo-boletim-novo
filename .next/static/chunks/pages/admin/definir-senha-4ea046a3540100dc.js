(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[436],{7043:function(e,t,a){(window.__NEXT_P=window.__NEXT_P||[]).push(["/admin/definir-senha",function(){return a(7795)}])},7795:function(e,t,a){"use strict";a.r(t),a.d(t,{default:function(){return m}});var r=a(5893),s=a(7294),i=a(9332),o=a(5150),n=a(9346),l=a(8778),d=a(8860),c=a(6501),u=a(4958);function m(){let e=(0,i.useRouter)();(0,i.useSearchParams)();let[t,a]=(0,s.useState)(""),[m,p]=(0,s.useState)(""),[f,h]=(0,s.useState)(!1),[g,b]=(0,s.useState)(""),[x,y]=(0,s.useState)(!1),[v,w]=(0,s.useState)("");(0,s.useEffect)(()=>{(async()=>{var e;let{data:{session:t}}=await o.O.auth.getSession();if(!t){b("Link inv\xe1lido ou expirado. Solicite um novo link de redefini\xe7\xe3o.");return}w((null===(e=t.user)||void 0===e?void 0:e.email)||"")})()},[]);let j=async a=>{a.preventDefault(),b("");let{valid:r,errors:s}=function(e){let t=[];return e.length<8&&t.push("M\xednimo 8 caracteres"),/[A-Z]/.test(e)||t.push("Pelo menos 1 letra mai\xfascula"),/[a-z]/.test(e)||t.push("Pelo menos 1 letra min\xfascula"),/[0-9]/.test(e)||t.push("Pelo menos 1 n\xfamero"),/[!@#$%^&*(),.?":{}|<>]/.test(e)||t.push("Pelo menos 1 s\xedmbolo (!@#$%^&*...)"),{valid:0===t.length,errors:t}}(t);if(!r){b("Senha inv\xe1lida: "+s.join(", "));return}if(t!==m){b("As senhas n\xe3o coincidem.");return}h(!0);try{let{error:a}=await o.O.auth.updateUser({password:t});if(a){b("Erro ao atualizar senha na autentica\xe7\xe3o: "+a.message),h(!1);return}let r=await u.ZP.hash(t,12),{error:s}=await o.O.from("users").update({senha_hash:r,primeira_senha:!1,updated_at:new Date().toISOString()}).eq("email",v);if(s){b("Erro ao atualizar dados do usu\xe1rio: "+s.message),h(!1);return}c.Am.success("Senha redefinida com sucesso!"),y(!0),setTimeout(()=>{e.push("/admin/login")},2e3)}catch(e){b("Erro inesperado: "+e.message),h(!1)}};return(0,r.jsx)("div",{className:"min-h-screen flex items-center justify-center bg-gray-50",children:(0,r.jsxs)(n.Zb,{className:"w-full max-w-md mx-auto",children:[(0,r.jsxs)(n.Ol,{className:"text-center",children:[(0,r.jsx)("h2",{className:"text-2xl font-bold mb-2",children:"Definir Nova Senha"}),(0,r.jsx)("p",{className:"text-gray-600 text-sm",children:"Digite sua nova senha de acesso"})]}),(0,r.jsx)(n.aY,{children:x?(0,r.jsxs)("div",{className:"text-center",children:[(0,r.jsx)("div",{className:"text-green-600 font-semibold mb-4",children:"Senha atualizada com sucesso!"}),(0,r.jsx)("p",{className:"text-gray-600",children:"Redirecionando para o login..."})]}):(0,r.jsxs)("form",{onSubmit:j,className:"space-y-4",children:[(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block mb-1 font-medium",children:"Nova Senha"}),(0,r.jsx)(d.I,{type:"password",className:"w-full",value:t,onChange:e=>a(e.target.value),required:!0,minLength:8,autoFocus:!0,placeholder:"M\xedn. 8 chars, mai\xfasc., min\xfasc., n\xfam., s\xedmbolo"})]}),(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block mb-1 font-medium",children:"Confirmar Senha"}),(0,r.jsx)(d.I,{type:"password",className:"w-full",value:m,onChange:e=>p(e.target.value),required:!0,minLength:8,placeholder:"Digite a senha novamente"})]}),(0,r.jsxs)("div",{className:"bg-blue-50 border border-blue-200 p-3 rounded text-sm",children:[(0,r.jsx)("strong",{children:"\uD83D\uDCCB Requisitos da senha:"}),(0,r.jsxs)("ul",{className:"mt-1 space-y-1 text-blue-800",children:[(0,r.jsx)("li",{children:"• M\xednimo 8 caracteres"}),(0,r.jsx)("li",{children:"• Pelo menos 1 mai\xfascula (A-Z)"}),(0,r.jsx)("li",{children:"• Pelo menos 1 min\xfascula (a-z)"}),(0,r.jsx)("li",{children:"• Pelo menos 1 n\xfamero (0-9)"}),(0,r.jsx)("li",{children:"• Pelo menos 1 s\xedmbolo (!@#$%...)"})]})]}),g&&(0,r.jsx)("div",{className:"text-red-600 text-sm",children:g}),(0,r.jsx)(l.z,{type:"submit",className:"w-full",disabled:f,children:f?"Atualizando...":"Atualizar Senha"}),(0,r.jsx)(l.z,{type:"button",variant:"ghost",className:"w-full",onClick:()=>e.push("/admin/login"),children:"Voltar ao Login"})]})})]})})}},8778:function(e,t,a){"use strict";a.d(t,{z:function(){return d}});var r=a(5893),s=a(7294),i=a(8426),o=a(2003),n=a(5156);let l=(0,o.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-5 py-2",{variants:{variant:{default:"bg-primary text-white hover:bg-primary2 transition-colors",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90",outline:"border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"}},defaultVariants:{variant:"default",size:"default"}}),d=s.forwardRef((e,t)=>{let{className:a,variant:s,size:o,asChild:d=!1,...c}=e,u=d?i.g7:"button";return(0,r.jsx)(u,{className:(0,n.cn)(l({variant:s,size:o,className:a})),ref:t,...c})});d.displayName="Button"},9346:function(e,t,a){"use strict";a.d(t,{Ol:function(){return n},Zb:function(){return o},aY:function(){return d},ll:function(){return l}});var r=a(5893),s=a(7294),i=a(5156);let o=s.forwardRef((e,t)=>{let{className:a,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,i.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",a),...s})});o.displayName="Card";let n=s.forwardRef((e,t)=>{let{className:a,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,i.cn)("flex flex-col space-y-1.5 p-6",a),...s})});n.displayName="CardHeader";let l=s.forwardRef((e,t)=>{let{className:a,...s}=e;return(0,r.jsx)("h3",{ref:t,className:(0,i.cn)("text-2xl font-semibold leading-none tracking-tight",a),...s})});l.displayName="CardTitle",s.forwardRef((e,t)=>{let{className:a,...s}=e;return(0,r.jsx)("p",{ref:t,className:(0,i.cn)("text-sm text-muted-foreground",a),...s})}).displayName="CardDescription";let d=s.forwardRef((e,t)=>{let{className:a,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,i.cn)("p-6 pt-0",a),...s})});d.displayName="CardContent",s.forwardRef((e,t)=>{let{className:a,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,i.cn)("flex items-center p-6 pt-0",a),...s})}).displayName="CardFooter"},8860:function(e,t,a){"use strict";a.d(t,{I:function(){return o}});var r=a(5893),s=a(7294),i=a(5156);let o=s.forwardRef((e,t)=>{let{className:a,type:s,...o}=e;return(0,r.jsx)("input",{type:s,className:(0,i.cn)("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",a),ref:t,...o})});o.displayName="Input"},5150:function(e,t,a){"use strict";a.d(t,{O:function(){return r}});let r=(0,a(6844).eI)("https://elcbodhxzvoqpzamgown.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw")},6118:function(){},6501:function(e,t,a){"use strict";let r,s;a.d(t,{Am:function(){return A}});var i,o=a(7294);let n={data:""},l=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||n,d=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,c=/\/\*[^]*?\*\/|  +/g,u=/\n+/g,m=(e,t)=>{let a="",r="",s="";for(let i in e){let o=e[i];"@"==i[0]?"i"==i[1]?a=i+" "+o+";":r+="f"==i[1]?m(o,i):i+"{"+m(o,"k"==i[1]?"":t)+"}":"object"==typeof o?r+=m(o,t?t.replace(/([^,])+/g,e=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):i):null!=o&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),s+=m.p?m.p(i,o):i+":"+o+";")}return a+(t&&s?t+"{"+s+"}":s)+r},p={},f=e=>{if("object"==typeof e){let t="";for(let a in e)t+=a+f(e[a]);return t}return e},h=(e,t,a,r,s)=>{var i;let o=f(e),n=p[o]||(p[o]=(e=>{let t=0,a=11;for(;t<e.length;)a=101*a+e.charCodeAt(t++)>>>0;return"go"+a})(o));if(!p[n]){let t=o!==e?e:(e=>{let t,a,r=[{}];for(;t=d.exec(e.replace(c,""));)t[4]?r.shift():t[3]?(a=t[3].replace(u," ").trim(),r.unshift(r[0][a]=r[0][a]||{})):r[0][t[1]]=t[2].replace(u," ").trim();return r[0]})(e);p[n]=m(s?{["@keyframes "+n]:t}:t,a?"":"."+n)}let l=a&&p.g?p.g:null;return a&&(p.g=p[n]),i=p[n],l?t.data=t.data.replace(l,i):-1===t.data.indexOf(i)&&(t.data=r?i+t.data:t.data+i),n},g=(e,t,a)=>e.reduce((e,r,s)=>{let i=t[s];if(i&&i.call){let e=i(a),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;i=t?"."+t:e&&"object"==typeof e?e.props?"":m(e,""):!1===e?"":e}return e+r+(null==i?"":i)},"");function b(e){let t=this||{},a=e.call?e(t.p):e;return h(a.unshift?a.raw?g(a,[].slice.call(arguments,1),t.p):a.reduce((e,a)=>Object.assign(e,a&&a.call?a(t.p):a),{}):a,l(t.target),t.g,t.o,t.k)}b.bind({g:1});let x,y,v,w=b.bind({k:1});function j(e,t){let a=this||{};return function(){let r=arguments;function s(i,o){let n=Object.assign({},i),l=n.className||s.className;a.p=Object.assign({theme:y&&y()},n),a.o=/ *go\d+/.test(l),n.className=b.apply(a,r)+(l?" "+l:""),t&&(n.ref=o);let d=e;return e[0]&&(d=n.as||e,delete n.as),v&&d[0]&&v(n),x(d,n)}return t?t(s):s}}var N=e=>"function"==typeof e,k=(e,t)=>N(e)?e(t):e,z=(r=0,()=>(++r).toString()),I=()=>{if(void 0===s&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");s=!e||e.matches}return s},E=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:a}=t;return E(e,{type:e.toasts.find(e=>e.id===a.id)?1:0,toast:a});case 3:let{toastId:r}=t;return{...e,toasts:e.toasts.map(e=>e.id===r||void 0===r?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+s}))}}},S=[],C={toasts:[],pausedAt:void 0},$=e=>{C=E(C,e),S.forEach(e=>{e(C)})},_=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(null==a?void 0:a.id)||z()}),O=e=>(t,a)=>{let r=_(t,e,a);return $({type:2,toast:r}),r.id},A=(e,t)=>O("blank")(e,t);A.error=O("error"),A.success=O("success"),A.loading=O("loading"),A.custom=O("custom"),A.dismiss=e=>{$({type:3,toastId:e})},A.remove=e=>$({type:4,toastId:e}),A.promise=(e,t,a)=>{let r=A.loading(t.loading,{...a,...null==a?void 0:a.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let s=t.success?k(t.success,e):void 0;return s?A.success(s,{id:r,...a,...null==a?void 0:a.success}):A.dismiss(r),e}).catch(e=>{let s=t.error?k(t.error,e):void 0;s?A.error(s,{id:r,...a,...null==a?void 0:a.error}):A.dismiss(r)}),e};var D=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,P=w`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,R=w`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,Z=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${D} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${P} 0.15s ease-out forwards;
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
    animation: ${R} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,M=w`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,q=j("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${M} 1s linear infinite;
`,F=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,L=w`
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
}`,J=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${F} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${L} 0.2s ease-out forwards;
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
`,T=j("div")`
  position: absolute;
`,X=j("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,Y=w`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,B=j("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${Y} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,V=({toast:e})=>{let{icon:t,type:a,iconTheme:r}=e;return void 0!==t?"string"==typeof t?o.createElement(B,null,t):t:"blank"===a?null:o.createElement(X,null,o.createElement(q,{...r}),"loading"!==a&&o.createElement(T,null,"error"===a?o.createElement(Z,{...r}):o.createElement(J,{...r})))},G=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,H=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,Q=j("div")`
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
`,W=j("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,U=(e,t)=>{let a=e.includes("top")?1:-1,[r,s]=I()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[G(a),H(a)];return{animation:t?`${w(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(s)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};o.memo(({toast:e,position:t,style:a,children:r})=>{let s=e.height?U(e.position||t||"top-center",e.visible):{opacity:0},i=o.createElement(V,{toast:e}),n=o.createElement(W,{...e.ariaProps},k(e.message,e));return o.createElement(Q,{className:e.className,style:{...s,...a,...e.style}},"function"==typeof r?r({icon:i,message:n}):o.createElement(o.Fragment,null,i,n))}),i=o.createElement,m.p=void 0,x=i,y=void 0,v=void 0,b`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`}},function(e){e.O(0,[844,332,958,888,774,179],function(){return e(e.s=7043)}),_N_E=e.O()}]);