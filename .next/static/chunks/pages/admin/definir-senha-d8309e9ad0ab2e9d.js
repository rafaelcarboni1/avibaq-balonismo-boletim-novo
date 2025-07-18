(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6436],{37043:function(e,t,a){(window.__NEXT_P=window.__NEXT_P||[]).push(["/admin/definir-senha",function(){return a(87795)}])},87795:function(e,t,a){"use strict";a.r(t),a.d(t,{default:function(){return m}});var r=a(85893),s=a(67294),o=a(11163),i=a(35150),n=a(89346),l=a(98778),c=a(88860),d=a(86501),u=a(74958);function m(){let e=(0,o.useRouter)(),[t,a]=(0,s.useState)(""),[m,p]=(0,s.useState)(""),[f,h]=(0,s.useState)(!1),[g,b]=(0,s.useState)(""),[x,y]=(0,s.useState)(!1),[v,w]=(0,s.useState)("");(0,s.useEffect)(()=>{(async()=>{var e,t;let a=new URLSearchParams(window.location.hash.substring(1)),r=a.get("access_token"),s=a.get("refresh_token"),o=a.get("type");if(r&&"recovery"===o){let{data:e,error:a}=await i.O.auth.setSession({access_token:r,refresh_token:s||""});if(a){b("Erro ao processar link de redefini\xe7\xe3o: "+a.message);return}if(null===(t=e.session)||void 0===t?void 0:t.user){w(e.session.user.email||""),window.history.replaceState({},document.title,window.location.pathname);return}}let{data:{session:n}}=await i.O.auth.getSession();if(!n){b("Link inv\xe1lido ou expirado. Solicite um novo link de redefini\xe7\xe3o.");return}w((null===(e=n.user)||void 0===e?void 0:e.email)||"")})()},[]);let j=async a=>{a.preventDefault(),console.log("\uD83D\uDD27 [DEBUG] Iniciando redefini\xe7\xe3o de senha..."),b("");let{valid:r,errors:s}=function(e){let t=[];return e.length<8&&t.push("M\xednimo 8 caracteres"),/[A-Z]/.test(e)||t.push("Pelo menos 1 letra mai\xfascula"),/[a-z]/.test(e)||t.push("Pelo menos 1 letra min\xfascula"),/[0-9]/.test(e)||t.push("Pelo menos 1 n\xfamero"),/[!@#$%^&*(),.?":{}|<>]/.test(e)||t.push("Pelo menos 1 s\xedmbolo (!@#$%^&*...)"),{valid:0===t.length,errors:t}}(t);if(!r){console.log("❌ [DEBUG] Senha inv\xe1lida:",s),b("Senha inv\xe1lida: "+s.join(", "));return}if(t!==m){console.log("❌ [DEBUG] Senhas n\xe3o coincidem"),b("As senhas n\xe3o coincidem.");return}console.log("✅ [DEBUG] Valida\xe7\xf5es passou, iniciando atualiza\xe7\xe3o..."),h(!0);try{console.log("\uD83D\uDD27 [DEBUG] Atualizando senha no Supabase Auth...");let{error:a}=await i.O.auth.updateUser({password:t});if(a){console.log("❌ [DEBUG] Erro no Supabase Auth:",a),b("Erro ao atualizar senha na autentica\xe7\xe3o: "+a.message),h(!1);return}console.log("✅ [DEBUG] Senha atualizada no Supabase Auth"),console.log("\uD83D\uDD27 [DEBUG] Gerando hash da nova senha...");let r=await u.ZP.hash(t,12);console.log("\uD83D\uDD27 [DEBUG] Atualizando tabela users com email:",v);let{error:s}=await i.O.from("users").update({senha_hash:r,primeira_senha:!1,updated_at:new Date().toISOString()}).eq("email",v);if(s){console.log("❌ [DEBUG] Erro na tabela users:",s),b("Erro ao atualizar dados do usu\xe1rio: "+s.message),h(!1);return}console.log("✅ [DEBUG] Tabela users atualizada com sucesso"),d.Am.success("Senha redefinida com sucesso!"),y(!0),setTimeout(()=>{e.push("/admin/login")},2e3)}catch(e){b("Erro inesperado: "+e.message),h(!1)}};return(0,r.jsx)("div",{className:"min-h-screen flex items-center justify-center bg-gray-50",children:(0,r.jsxs)(n.Zb,{className:"w-full max-w-md mx-auto",children:[(0,r.jsxs)(n.Ol,{className:"text-center",children:[(0,r.jsx)("h2",{className:"text-2xl font-bold mb-2",children:"Definir Nova Senha"}),(0,r.jsx)("p",{className:"text-gray-600 text-sm",children:"Digite sua nova senha de acesso"})]}),(0,r.jsx)(n.aY,{children:x?(0,r.jsxs)("div",{className:"text-center",children:[(0,r.jsx)("div",{className:"text-green-600 font-semibold mb-4",children:"Senha atualizada com sucesso!"}),(0,r.jsx)("p",{className:"text-gray-600",children:"Redirecionando para o login..."})]}):(0,r.jsxs)("form",{onSubmit:j,className:"space-y-4",children:[(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block mb-1 font-medium",children:"Nova Senha"}),(0,r.jsx)(c.I,{type:"password",className:"w-full",value:t,onChange:e=>a(e.target.value),required:!0,minLength:8,autoFocus:!0,placeholder:"M\xedn. 8 chars, mai\xfasc., min\xfasc., n\xfam., s\xedmbolo"})]}),(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block mb-1 font-medium",children:"Confirmar Senha"}),(0,r.jsx)(c.I,{type:"password",className:"w-full",value:m,onChange:e=>p(e.target.value),required:!0,minLength:8,placeholder:"Digite a senha novamente"})]}),(0,r.jsxs)("div",{className:"bg-blue-50 border border-blue-200 p-3 rounded text-sm",children:[(0,r.jsx)("strong",{children:"\uD83D\uDCCB Requisitos da senha:"}),(0,r.jsxs)("ul",{className:"mt-1 space-y-1 text-blue-800",children:[(0,r.jsx)("li",{children:"• M\xednimo 8 caracteres"}),(0,r.jsx)("li",{children:"• Pelo menos 1 mai\xfascula (A-Z)"}),(0,r.jsx)("li",{children:"• Pelo menos 1 min\xfascula (a-z)"}),(0,r.jsx)("li",{children:"• Pelo menos 1 n\xfamero (0-9)"}),(0,r.jsx)("li",{children:"• Pelo menos 1 s\xedmbolo (!@#$%...)"})]})]}),g&&(0,r.jsx)("div",{className:"text-red-600 text-sm",children:g}),(0,r.jsx)(l.z,{type:"submit",className:"w-full",disabled:f,children:f?"Atualizando...":"Atualizar Senha"}),(0,r.jsx)(l.z,{type:"button",variant:"ghost",className:"w-full",onClick:()=>e.push("/admin/login"),children:"Voltar ao Login"})]})})]})})}},98778:function(e,t,a){"use strict";a.d(t,{z:function(){return c}});var r=a(85893),s=a(67294),o=a(88426),i=a(12003),n=a(55156);let l=(0,i.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-5 py-2",{variants:{variant:{default:"bg-primary text-white hover:bg-primary2 transition-colors",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90",outline:"border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"}},defaultVariants:{variant:"default",size:"default"}}),c=s.forwardRef((e,t)=>{let{className:a,variant:s,size:i,asChild:c=!1,...d}=e,u=c?o.g7:"button";return(0,r.jsx)(u,{className:(0,n.cn)(l({variant:s,size:i,className:a})),ref:t,...d})});c.displayName="Button"},89346:function(e,t,a){"use strict";a.d(t,{Ol:function(){return n},SZ:function(){return c},Zb:function(){return i},aY:function(){return d},ll:function(){return l}});var r=a(85893),s=a(67294),o=a(55156);let i=s.forwardRef((e,t)=>{let{className:a,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,o.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",a),...s})});i.displayName="Card";let n=s.forwardRef((e,t)=>{let{className:a,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,o.cn)("flex flex-col space-y-1.5 p-6",a),...s})});n.displayName="CardHeader";let l=s.forwardRef((e,t)=>{let{className:a,...s}=e;return(0,r.jsx)("h3",{ref:t,className:(0,o.cn)("text-2xl font-semibold leading-none tracking-tight",a),...s})});l.displayName="CardTitle";let c=s.forwardRef((e,t)=>{let{className:a,...s}=e;return(0,r.jsx)("p",{ref:t,className:(0,o.cn)("text-sm text-muted-foreground",a),...s})});c.displayName="CardDescription";let d=s.forwardRef((e,t)=>{let{className:a,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,o.cn)("p-6 pt-0",a),...s})});d.displayName="CardContent",s.forwardRef((e,t)=>{let{className:a,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,o.cn)("flex items-center p-6 pt-0",a),...s})}).displayName="CardFooter"},88860:function(e,t,a){"use strict";a.d(t,{I:function(){return i}});var r=a(85893),s=a(67294),o=a(55156);let i=s.forwardRef((e,t)=>{let{className:a,type:s,...i}=e;return(0,r.jsx)("input",{type:s,className:(0,o.cn)("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",a),ref:t,...i})});i.displayName="Input"},35150:function(e,t,a){"use strict";a.d(t,{O:function(){return r}});let r=(0,a(56844).eI)("https://elcbodhxzvoqpzamgown.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw")},70468:function(){},86501:function(e,t,a){"use strict";let r,s;a.d(t,{Am:function(){return $}});var o,i=a(67294);let n={data:""},l=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||n,c=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,d=/\/\*[^]*?\*\/|  +/g,u=/\n+/g,m=(e,t)=>{let a="",r="",s="";for(let o in e){let i=e[o];"@"==o[0]?"i"==o[1]?a=o+" "+i+";":r+="f"==o[1]?m(i,o):o+"{"+m(i,"k"==o[1]?"":t)+"}":"object"==typeof i?r+=m(i,t?t.replace(/([^,])+/g,e=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):o):null!=i&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),s+=m.p?m.p(o,i):o+":"+i+";")}return a+(t&&s?t+"{"+s+"}":s)+r},p={},f=e=>{if("object"==typeof e){let t="";for(let a in e)t+=a+f(e[a]);return t}return e},h=(e,t,a,r,s)=>{var o;let i=f(e),n=p[i]||(p[i]=(e=>{let t=0,a=11;for(;t<e.length;)a=101*a+e.charCodeAt(t++)>>>0;return"go"+a})(i));if(!p[n]){let t=i!==e?e:(e=>{let t,a,r=[{}];for(;t=c.exec(e.replace(d,""));)t[4]?r.shift():t[3]?(a=t[3].replace(u," ").trim(),r.unshift(r[0][a]=r[0][a]||{})):r[0][t[1]]=t[2].replace(u," ").trim();return r[0]})(e);p[n]=m(s?{["@keyframes "+n]:t}:t,a?"":"."+n)}let l=a&&p.g?p.g:null;return a&&(p.g=p[n]),o=p[n],l?t.data=t.data.replace(l,o):-1===t.data.indexOf(o)&&(t.data=r?o+t.data:t.data+o),n},g=(e,t,a)=>e.reduce((e,r,s)=>{let o=t[s];if(o&&o.call){let e=o(a),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;o=t?"."+t:e&&"object"==typeof e?e.props?"":m(e,""):!1===e?"":e}return e+r+(null==o?"":o)},"");function b(e){let t=this||{},a=e.call?e(t.p):e;return h(a.unshift?a.raw?g(a,[].slice.call(arguments,1),t.p):a.reduce((e,a)=>Object.assign(e,a&&a.call?a(t.p):a),{}):a,l(t.target),t.g,t.o,t.k)}b.bind({g:1});let x,y,v,w=b.bind({k:1});function j(e,t){let a=this||{};return function(){let r=arguments;function s(o,i){let n=Object.assign({},o),l=n.className||s.className;a.p=Object.assign({theme:y&&y()},n),a.o=/ *go\d+/.test(l),n.className=b.apply(a,r)+(l?" "+l:""),t&&(n.ref=i);let c=e;return e[0]&&(c=n.as||e,delete n.as),v&&c[0]&&v(n),x(c,n)}return t?t(s):s}}var N=e=>"function"==typeof e,D=(e,t)=>N(e)?e(t):e,E=(r=0,()=>(++r).toString()),S=()=>{if(void 0===s&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");s=!e||e.matches}return s},k=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:a}=t;return k(e,{type:e.toasts.find(e=>e.id===a.id)?1:0,toast:a});case 3:let{toastId:r}=t;return{...e,toasts:e.toasts.map(e=>e.id===r||void 0===r?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+s}))}}},z=[],I={toasts:[],pausedAt:void 0},_=e=>{I=k(I,e),z.forEach(e=>{e(I)})},C=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(null==a?void 0:a.id)||E()}),A=e=>(t,a)=>{let r=C(t,e,a);return _({type:2,toast:r}),r.id},$=(e,t)=>A("blank")(e,t);$.error=A("error"),$.success=A("success"),$.loading=A("loading"),$.custom=A("custom"),$.dismiss=e=>{_({type:3,toastId:e})},$.remove=e=>_({type:4,toastId:e}),$.promise=(e,t,a)=>{let r=$.loading(t.loading,{...a,...null==a?void 0:a.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let s=t.success?D(t.success,e):void 0;return s?$.success(s,{id:r,...a,...null==a?void 0:a.success}):$.dismiss(r),e}).catch(e=>{let s=t.error?D(t.error,e):void 0;s?$.error(s,{id:r,...a,...null==a?void 0:a.error}):$.dismiss(r)}),e};var O=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,B=w`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,G=w`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,P=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${O} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${B} 0.15s ease-out forwards;
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
    animation: ${G} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,R=w`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,U=j("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${R} 1s linear infinite;
`,Z=w`
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
}`,M=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Z} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
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
`,q=j("div")`
  position: absolute;
`,F=j("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,T=w`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,J=j("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${T} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,V=({toast:e})=>{let{icon:t,type:a,iconTheme:r}=e;return void 0!==t?"string"==typeof t?i.createElement(J,null,t):t:"blank"===a?null:i.createElement(F,null,i.createElement(U,{...r}),"loading"!==a&&i.createElement(q,null,"error"===a?i.createElement(P,{...r}):i.createElement(M,{...r})))},X=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Y=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,H=j("div")`
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
`,W=(e,t)=>{let a=e.includes("top")?1:-1,[r,s]=S()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[X(a),Y(a)];return{animation:t?`${w(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(s)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};i.memo(({toast:e,position:t,style:a,children:r})=>{let s=e.height?W(e.position||t||"top-center",e.visible):{opacity:0},o=i.createElement(V,{toast:e}),n=i.createElement(Q,{...e.ariaProps},D(e.message,e));return i.createElement(H,{className:e.className,style:{...s,...a,...e.style}},"function"==typeof r?r({icon:o,message:n}):i.createElement(i.Fragment,null,o,n))}),o=i.createElement,m.p=void 0,x=o,y=void 0,v=void 0,b`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`}},function(e){e.O(0,[2602,4958,2888,9774,179],function(){return e(e.s=37043)}),_N_E=e.O()}]);