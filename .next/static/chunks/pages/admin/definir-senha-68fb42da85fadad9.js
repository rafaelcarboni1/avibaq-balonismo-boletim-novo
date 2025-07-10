(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[436],{7043:function(e,t,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/admin/definir-senha",function(){return r(7795)}])},7795:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return m}});var a=r(5893),s=r(7294),o=r(9332),i=r(5150),n=r(9346),l=r(8778),c=r(8860),d=r(6501),u=r(4958);function m(){let e=(0,o.useRouter)();(0,o.useSearchParams)();let[t,r]=(0,s.useState)(""),[m,p]=(0,s.useState)(""),[f,h]=(0,s.useState)(!1),[g,b]=(0,s.useState)(""),[x,y]=(0,s.useState)(!1),[v,w]=(0,s.useState)("");(0,s.useEffect)(()=>{(async()=>{var e,t;let r=new URLSearchParams(window.location.hash.substring(1)),a=r.get("access_token"),s=r.get("refresh_token"),o=r.get("type");if(a&&"recovery"===o){let{data:e,error:r}=await i.O.auth.setSession({access_token:a,refresh_token:s||""});if(r){b("Erro ao processar link de redefini\xe7\xe3o: "+r.message);return}if(null===(t=e.session)||void 0===t?void 0:t.user){w(e.session.user.email||""),window.history.replaceState({},document.title,window.location.pathname);return}}let{data:{session:n}}=await i.O.auth.getSession();if(!n){b("Link inv\xe1lido ou expirado. Solicite um novo link de redefini\xe7\xe3o.");return}w((null===(e=n.user)||void 0===e?void 0:e.email)||"")})()},[]);let j=async r=>{r.preventDefault(),b("");let{valid:a,errors:s}=function(e){let t=[];return e.length<8&&t.push("M\xednimo 8 caracteres"),/[A-Z]/.test(e)||t.push("Pelo menos 1 letra mai\xfascula"),/[a-z]/.test(e)||t.push("Pelo menos 1 letra min\xfascula"),/[0-9]/.test(e)||t.push("Pelo menos 1 n\xfamero"),/[!@#$%^&*(),.?":{}|<>]/.test(e)||t.push("Pelo menos 1 s\xedmbolo (!@#$%^&*...)"),{valid:0===t.length,errors:t}}(t);if(!a){b("Senha inv\xe1lida: "+s.join(", "));return}if(t!==m){b("As senhas n\xe3o coincidem.");return}h(!0);try{let{error:r}=await i.O.auth.updateUser({password:t});if(r){b("Erro ao atualizar senha na autentica\xe7\xe3o: "+r.message),h(!1);return}let a=await u.ZP.hash(t,12),{error:s}=await i.O.from("users").update({senha_hash:a,primeira_senha:!1,updated_at:new Date().toISOString()}).eq("email",v);if(s){b("Erro ao atualizar dados do usu\xe1rio: "+s.message),h(!1);return}d.Am.success("Senha redefinida com sucesso!"),y(!0),setTimeout(()=>{e.push("/admin/login")},2e3)}catch(e){b("Erro inesperado: "+e.message),h(!1)}};return(0,a.jsx)("div",{className:"min-h-screen flex items-center justify-center bg-gray-50",children:(0,a.jsxs)(n.Zb,{className:"w-full max-w-md mx-auto",children:[(0,a.jsxs)(n.Ol,{className:"text-center",children:[(0,a.jsx)("h2",{className:"text-2xl font-bold mb-2",children:"Definir Nova Senha"}),(0,a.jsx)("p",{className:"text-gray-600 text-sm",children:"Digite sua nova senha de acesso"})]}),(0,a.jsx)(n.aY,{children:x?(0,a.jsxs)("div",{className:"text-center",children:[(0,a.jsx)("div",{className:"text-green-600 font-semibold mb-4",children:"Senha atualizada com sucesso!"}),(0,a.jsx)("p",{className:"text-gray-600",children:"Redirecionando para o login..."})]}):(0,a.jsxs)("form",{onSubmit:j,className:"space-y-4",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block mb-1 font-medium",children:"Nova Senha"}),(0,a.jsx)(c.I,{type:"password",className:"w-full",value:t,onChange:e=>r(e.target.value),required:!0,minLength:8,autoFocus:!0,placeholder:"M\xedn. 8 chars, mai\xfasc., min\xfasc., n\xfam., s\xedmbolo"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block mb-1 font-medium",children:"Confirmar Senha"}),(0,a.jsx)(c.I,{type:"password",className:"w-full",value:m,onChange:e=>p(e.target.value),required:!0,minLength:8,placeholder:"Digite a senha novamente"})]}),(0,a.jsxs)("div",{className:"bg-blue-50 border border-blue-200 p-3 rounded text-sm",children:[(0,a.jsx)("strong",{children:"\uD83D\uDCCB Requisitos da senha:"}),(0,a.jsxs)("ul",{className:"mt-1 space-y-1 text-blue-800",children:[(0,a.jsx)("li",{children:"• M\xednimo 8 caracteres"}),(0,a.jsx)("li",{children:"• Pelo menos 1 mai\xfascula (A-Z)"}),(0,a.jsx)("li",{children:"• Pelo menos 1 min\xfascula (a-z)"}),(0,a.jsx)("li",{children:"• Pelo menos 1 n\xfamero (0-9)"}),(0,a.jsx)("li",{children:"• Pelo menos 1 s\xedmbolo (!@#$%...)"})]})]}),g&&(0,a.jsx)("div",{className:"text-red-600 text-sm",children:g}),(0,a.jsx)(l.z,{type:"submit",className:"w-full",disabled:f,children:f?"Atualizando...":"Atualizar Senha"}),(0,a.jsx)(l.z,{type:"button",variant:"ghost",className:"w-full",onClick:()=>e.push("/admin/login"),children:"Voltar ao Login"})]})})]})})}},8778:function(e,t,r){"use strict";r.d(t,{z:function(){return c}});var a=r(5893),s=r(7294),o=r(8426),i=r(2003),n=r(5156);let l=(0,i.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-5 py-2",{variants:{variant:{default:"bg-primary text-white hover:bg-primary2 transition-colors",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90",outline:"border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"}},defaultVariants:{variant:"default",size:"default"}}),c=s.forwardRef((e,t)=>{let{className:r,variant:s,size:i,asChild:c=!1,...d}=e,u=c?o.g7:"button";return(0,a.jsx)(u,{className:(0,n.cn)(l({variant:s,size:i,className:r})),ref:t,...d})});c.displayName="Button"},9346:function(e,t,r){"use strict";r.d(t,{Ol:function(){return n},Zb:function(){return i},aY:function(){return c},ll:function(){return l}});var a=r(5893),s=r(7294),o=r(5156);let i=s.forwardRef((e,t)=>{let{className:r,...s}=e;return(0,a.jsx)("div",{ref:t,className:(0,o.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",r),...s})});i.displayName="Card";let n=s.forwardRef((e,t)=>{let{className:r,...s}=e;return(0,a.jsx)("div",{ref:t,className:(0,o.cn)("flex flex-col space-y-1.5 p-6",r),...s})});n.displayName="CardHeader";let l=s.forwardRef((e,t)=>{let{className:r,...s}=e;return(0,a.jsx)("h3",{ref:t,className:(0,o.cn)("text-2xl font-semibold leading-none tracking-tight",r),...s})});l.displayName="CardTitle",s.forwardRef((e,t)=>{let{className:r,...s}=e;return(0,a.jsx)("p",{ref:t,className:(0,o.cn)("text-sm text-muted-foreground",r),...s})}).displayName="CardDescription";let c=s.forwardRef((e,t)=>{let{className:r,...s}=e;return(0,a.jsx)("div",{ref:t,className:(0,o.cn)("p-6 pt-0",r),...s})});c.displayName="CardContent",s.forwardRef((e,t)=>{let{className:r,...s}=e;return(0,a.jsx)("div",{ref:t,className:(0,o.cn)("flex items-center p-6 pt-0",r),...s})}).displayName="CardFooter"},8860:function(e,t,r){"use strict";r.d(t,{I:function(){return i}});var a=r(5893),s=r(7294),o=r(5156);let i=s.forwardRef((e,t)=>{let{className:r,type:s,...i}=e;return(0,a.jsx)("input",{type:s,className:(0,o.cn)("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",r),ref:t,...i})});i.displayName="Input"},5150:function(e,t,r){"use strict";r.d(t,{O:function(){return a}});let a=(0,r(6844).eI)("https://elcbodhxzvoqpzamgown.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw")},468:function(){},6501:function(e,t,r){"use strict";let a,s;r.d(t,{Am:function(){return A}});var o,i=r(7294);let n={data:""},l=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||n,c=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,d=/\/\*[^]*?\*\/|  +/g,u=/\n+/g,m=(e,t)=>{let r="",a="",s="";for(let o in e){let i=e[o];"@"==o[0]?"i"==o[1]?r=o+" "+i+";":a+="f"==o[1]?m(i,o):o+"{"+m(i,"k"==o[1]?"":t)+"}":"object"==typeof i?a+=m(i,t?t.replace(/([^,])+/g,e=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):o):null!=i&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),s+=m.p?m.p(o,i):o+":"+i+";")}return r+(t&&s?t+"{"+s+"}":s)+a},p={},f=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+f(e[r]);return t}return e},h=(e,t,r,a,s)=>{var o;let i=f(e),n=p[i]||(p[i]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(i));if(!p[n]){let t=i!==e?e:(e=>{let t,r,a=[{}];for(;t=c.exec(e.replace(d,""));)t[4]?a.shift():t[3]?(r=t[3].replace(u," ").trim(),a.unshift(a[0][r]=a[0][r]||{})):a[0][t[1]]=t[2].replace(u," ").trim();return a[0]})(e);p[n]=m(s?{["@keyframes "+n]:t}:t,r?"":"."+n)}let l=r&&p.g?p.g:null;return r&&(p.g=p[n]),o=p[n],l?t.data=t.data.replace(l,o):-1===t.data.indexOf(o)&&(t.data=a?o+t.data:t.data+o),n},g=(e,t,r)=>e.reduce((e,a,s)=>{let o=t[s];if(o&&o.call){let e=o(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;o=t?"."+t:e&&"object"==typeof e?e.props?"":m(e,""):!1===e?"":e}return e+a+(null==o?"":o)},"");function b(e){let t=this||{},r=e.call?e(t.p):e;return h(r.unshift?r.raw?g(r,[].slice.call(arguments,1),t.p):r.reduce((e,r)=>Object.assign(e,r&&r.call?r(t.p):r),{}):r,l(t.target),t.g,t.o,t.k)}b.bind({g:1});let x,y,v,w=b.bind({k:1});function j(e,t){let r=this||{};return function(){let a=arguments;function s(o,i){let n=Object.assign({},o),l=n.className||s.className;r.p=Object.assign({theme:y&&y()},n),r.o=/ *go\d+/.test(l),n.className=b.apply(r,a)+(l?" "+l:""),t&&(n.ref=i);let c=e;return e[0]&&(c=n.as||e,delete n.as),v&&c[0]&&v(n),x(c,n)}return t?t(s):s}}var N=e=>"function"==typeof e,k=(e,t)=>N(e)?e(t):e,S=(a=0,()=>(++a).toString()),z=()=>{if(void 0===s&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");s=!e||e.matches}return s},E=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:r}=t;return E(e,{type:e.toasts.find(e=>e.id===r.id)?1:0,toast:r});case 3:let{toastId:a}=t;return{...e,toasts:e.toasts.map(e=>e.id===a||void 0===a?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+s}))}}},I=[],_={toasts:[],pausedAt:void 0},C=e=>{_=E(_,e),I.forEach(e=>{e(_)})},$=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||S()}),O=e=>(t,r)=>{let a=$(t,e,r);return C({type:2,toast:a}),a.id},A=(e,t)=>O("blank")(e,t);A.error=O("error"),A.success=O("success"),A.loading=O("loading"),A.custom=O("custom"),A.dismiss=e=>{C({type:3,toastId:e})},A.remove=e=>C({type:4,toastId:e}),A.promise=(e,t,r)=>{let a=A.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let s=t.success?k(t.success,e):void 0;return s?A.success(s,{id:a,...r,...null==r?void 0:r.success}):A.dismiss(a),e}).catch(e=>{let s=t.error?k(t.error,e):void 0;s?A.error(s,{id:a,...r,...null==r?void 0:r.error}):A.dismiss(a)}),e};var D=w`
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
`,L=w`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,M=j("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${L} 1s linear infinite;
`,q=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,F=w`
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

  animation: ${q} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${F} 0.2s ease-out forwards;
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
`,V=({toast:e})=>{let{icon:t,type:r,iconTheme:a}=e;return void 0!==t?"string"==typeof t?i.createElement(B,null,t):t:"blank"===r?null:i.createElement(X,null,i.createElement(M,{...a}),"loading"!==r&&i.createElement(T,null,"error"===r?i.createElement(Z,{...a}):i.createElement(J,{...a})))},G=e=>`
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
`,U=j("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,W=(e,t)=>{let r=e.includes("top")?1:-1,[a,s]=z()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[G(r),H(r)];return{animation:t?`${w(a)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(s)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};i.memo(({toast:e,position:t,style:r,children:a})=>{let s=e.height?W(e.position||t||"top-center",e.visible):{opacity:0},o=i.createElement(V,{toast:e}),n=i.createElement(U,{...e.ariaProps},k(e.message,e));return i.createElement(Q,{className:e.className,style:{...s,...r,...e.style}},"function"==typeof a?a({icon:o,message:n}):i.createElement(i.Fragment,null,o,n))}),o=i.createElement,m.p=void 0,x=o,y=void 0,v=void 0,b`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`}},function(e){e.O(0,[844,332,958,888,774,179],function(){return e(e.s=7043)}),_N_E=e.O()}]);