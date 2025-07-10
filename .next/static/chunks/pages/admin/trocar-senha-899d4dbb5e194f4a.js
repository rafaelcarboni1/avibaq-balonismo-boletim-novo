(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[211],{8677:function(e,t,a){(window.__NEXT_P=window.__NEXT_P||[]).push(["/admin/trocar-senha",function(){return a(4793)}])},4793:function(e,t,a){"use strict";a.r(t),a.d(t,{default:function(){return m}});var r=a(5893),o=a(7294),s=a(9332),n=a(5150),i=a(9346),l=a(8778),d=a(8860),c=a(6501),u=a(4958);function m(){let[e,t]=(0,o.useState)(""),[a,m]=(0,o.useState)(""),[p,f]=(0,o.useState)(""),[h,g]=(0,o.useState)(!1),[b,x]=(0,o.useState)(null),v=(0,s.useRouter)();async function y(){let{data:{user:e}}=await n.O.auth.getUser();if(!e){v.push("/admin/login");return}let{data:t,error:a}=await n.O.from("users").select("*").eq("email",e.email).single();if(a||!t){c.Am.error("Erro ao carregar dados do usu\xe1rio"),v.push("/admin/login");return}x(t),t.primeira_senha||v.push("/admin/dashboard")}async function w(t){t.preventDefault(),console.log("\uD83D\uDD27 [DEBUG] Iniciando troca de senha..."),g(!0);try{if(!(null==b?void 0:b.senha_hash)){console.log("❌ [DEBUG] Erro: usu\xe1rio sem senha_hash"),c.Am.error("Erro: dados do usu\xe1rio inv\xe1lidos"),g(!1);return}if(console.log("\uD83D\uDD27 [DEBUG] Validando senha atual..."),!await u.ZP.compare(e,b.senha_hash)){console.log("❌ [DEBUG] Senha atual incorreta"),c.Am.error("Senha atual incorreta"),g(!1);return}console.log("✅ [DEBUG] Senha atual v\xe1lida");let{valid:t,errors:r}=function(e){let t=[];return e.length<8&&t.push("M\xednimo 8 caracteres"),/[A-Z]/.test(e)||t.push("Pelo menos 1 letra mai\xfascula"),/[a-z]/.test(e)||t.push("Pelo menos 1 letra min\xfascula"),/[0-9]/.test(e)||t.push("Pelo menos 1 n\xfamero"),/[!@#$%^&*(),.?":{}|<>]/.test(e)||t.push("Pelo menos 1 s\xedmbolo (!@#$%^&*...)"),{valid:0===t.length,errors:t}}(a);if(!t){console.log("❌ [DEBUG] Nova senha inv\xe1lida:",r),c.Am.error("Nova senha inv\xe1lida: "+r.join(", ")),g(!1);return}if(console.log("✅ [DEBUG] Nova senha v\xe1lida"),a!==p){c.Am.error("As senhas n\xe3o coincidem"),g(!1);return}if(await u.ZP.compare(a,b.senha_hash)){c.Am.error("A nova senha deve ser diferente da senha atual"),g(!1);return}console.log("\uD83D\uDD27 [DEBUG] Gerando hash da nova senha...");let o=await u.ZP.hash(a,12);console.log("\uD83D\uDD27 [DEBUG] Atualizando senha no Supabase Auth...");let{error:s}=await n.O.auth.updateUser({password:a});if(s){console.log("❌ [DEBUG] Erro no Supabase Auth:",s),c.Am.error("Erro ao atualizar senha na autentica\xe7\xe3o: "+s.message),g(!1);return}console.log("✅ [DEBUG] Senha atualizada no Supabase Auth"),console.log("\uD83D\uDD27 [DEBUG] Atualizando tabela users...");let{error:i}=await n.O.from("users").update({senha_hash:o,primeira_senha:!1,updated_at:new Date().toISOString()}).eq("id",b.id);if(i){console.log("❌ [DEBUG] Erro na tabela users:",i),c.Am.error("Erro ao atualizar dados do usu\xe1rio: "+i.message),g(!1);return}console.log("✅ [DEBUG] Tabela users atualizada com sucesso"),c.Am.success("Senha alterada com sucesso! Redirecionando..."),setTimeout(()=>{console.log("\uD83D\uDD27 [DEBUG] Redirecionando para dashboard..."),v.push("/admin/dashboard")},2e3)}catch(e){console.log("❌ [DEBUG] Erro catch:",e),c.Am.error("Erro interno: "+e.message),g(!1)}}return(0,o.useEffect)(()=>{y()},[]),(console.log("\uD83D\uDD27 [DEBUG] Estado do componente:",{user:!!b,loading:h,senhaAtual:e.length>0,novaSenha:a.length>0,confirmarSenha:p.length>0}),b)?(0,r.jsx)("div",{className:"min-h-screen flex items-center justify-center bg-gray-50",children:(0,r.jsxs)(i.Zb,{className:"w-full max-w-md mx-auto",children:[(0,r.jsxs)(i.Ol,{className:"text-center",children:[(0,r.jsx)("h2",{className:"text-2xl font-bold mb-2",children:"\uD83D\uDD10 Trocar Senha"}),(0,r.jsxs)("p",{className:"text-gray-600 text-sm mb-2",children:["Ol\xe1, ",(0,r.jsx)("strong",{children:b.nome}),"!"]}),(0,r.jsx)("p",{className:"text-orange-600 text-sm",children:"Por seguran\xe7a, voc\xea deve alterar sua senha tempor\xe1ria antes de continuar."})]}),(0,r.jsx)(i.aY,{children:(0,r.jsxs)("form",{onSubmit:w,className:"space-y-4",children:[(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block mb-1 font-medium",children:"Senha Atual"}),(0,r.jsx)(d.I,{type:"password",className:"w-full border rounded px-3 py-2",value:e,onChange:e=>t(e.target.value),required:!0,autoFocus:!0,placeholder:"Digite sua senha tempor\xe1ria"})]}),(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block mb-1 font-medium",children:"Nova Senha"}),(0,r.jsx)(d.I,{type:"password",className:"w-full border rounded px-3 py-2",value:a,onChange:e=>m(e.target.value),required:!0,placeholder:"M\xedn. 8 chars, mai\xfasc., min\xfasc., n\xfam., s\xedmbolo"})]}),(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block mb-1 font-medium",children:"Confirmar Nova Senha"}),(0,r.jsx)(d.I,{type:"password",className:"w-full border rounded px-3 py-2",value:p,onChange:e=>f(e.target.value),required:!0,placeholder:"Digite a nova senha novamente"})]}),(0,r.jsxs)("div",{className:"bg-blue-50 border border-blue-200 p-3 rounded text-sm",children:[(0,r.jsx)("strong",{children:"\uD83D\uDCCB Requisitos da senha:"}),(0,r.jsxs)("ul",{className:"mt-1 space-y-1 text-blue-800",children:[(0,r.jsx)("li",{children:"• M\xednimo 8 caracteres"}),(0,r.jsx)("li",{children:"• Pelo menos 1 mai\xfascula (A-Z)"}),(0,r.jsx)("li",{children:"• Pelo menos 1 min\xfascula (a-z)"}),(0,r.jsx)("li",{children:"• Pelo menos 1 n\xfamero (0-9)"}),(0,r.jsx)("li",{children:"• Pelo menos 1 s\xedmbolo (!@#$%...)"})]})]}),(0,r.jsx)(l.z,{type:"submit",className:"w-full",disabled:h,onClick:()=>console.log("\uD83D\uDD27 [DEBUG] Bot\xe3o clicado"),children:h?(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("span",{className:"animate-spin mr-2",children:"⏳"}),"Alterando senha..."]}):"Alterar Senha"}),h&&(0,r.jsx)("div",{className:"text-center text-sm text-blue-600 mt-2",children:"⚙️ Processando altera\xe7\xe3o de senha..."})]})})]})}):(0,r.jsx)("div",{className:"min-h-screen flex items-center justify-center bg-gray-50",children:(0,r.jsx)("div",{children:"Carregando..."})})}},8778:function(e,t,a){"use strict";a.d(t,{z:function(){return d}});var r=a(5893),o=a(7294),s=a(8426),n=a(2003),i=a(5156);let l=(0,n.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-5 py-2",{variants:{variant:{default:"bg-primary text-white hover:bg-primary2 transition-colors",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90",outline:"border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"}},defaultVariants:{variant:"default",size:"default"}}),d=o.forwardRef((e,t)=>{let{className:a,variant:o,size:n,asChild:d=!1,...c}=e,u=d?s.g7:"button";return(0,r.jsx)(u,{className:(0,i.cn)(l({variant:o,size:n,className:a})),ref:t,...c})});d.displayName="Button"},9346:function(e,t,a){"use strict";a.d(t,{Ol:function(){return i},Zb:function(){return n},aY:function(){return d},ll:function(){return l}});var r=a(5893),o=a(7294),s=a(5156);let n=o.forwardRef((e,t)=>{let{className:a,...o}=e;return(0,r.jsx)("div",{ref:t,className:(0,s.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",a),...o})});n.displayName="Card";let i=o.forwardRef((e,t)=>{let{className:a,...o}=e;return(0,r.jsx)("div",{ref:t,className:(0,s.cn)("flex flex-col space-y-1.5 p-6",a),...o})});i.displayName="CardHeader";let l=o.forwardRef((e,t)=>{let{className:a,...o}=e;return(0,r.jsx)("h3",{ref:t,className:(0,s.cn)("text-2xl font-semibold leading-none tracking-tight",a),...o})});l.displayName="CardTitle",o.forwardRef((e,t)=>{let{className:a,...o}=e;return(0,r.jsx)("p",{ref:t,className:(0,s.cn)("text-sm text-muted-foreground",a),...o})}).displayName="CardDescription";let d=o.forwardRef((e,t)=>{let{className:a,...o}=e;return(0,r.jsx)("div",{ref:t,className:(0,s.cn)("p-6 pt-0",a),...o})});d.displayName="CardContent",o.forwardRef((e,t)=>{let{className:a,...o}=e;return(0,r.jsx)("div",{ref:t,className:(0,s.cn)("flex items-center p-6 pt-0",a),...o})}).displayName="CardFooter"},8860:function(e,t,a){"use strict";a.d(t,{I:function(){return n}});var r=a(5893),o=a(7294),s=a(5156);let n=o.forwardRef((e,t)=>{let{className:a,type:o,...n}=e;return(0,r.jsx)("input",{type:o,className:(0,s.cn)("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",a),ref:t,...n})});n.displayName="Input"},5150:function(e,t,a){"use strict";a.d(t,{O:function(){return r}});let r=(0,a(6844).eI)("https://elcbodhxzvoqpzamgown.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw")},6118:function(){},6501:function(e,t,a){"use strict";let r,o;a.d(t,{Am:function(){return B}});var s,n=a(7294);let i={data:""},l=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||i,d=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,c=/\/\*[^]*?\*\/|  +/g,u=/\n+/g,m=(e,t)=>{let a="",r="",o="";for(let s in e){let n=e[s];"@"==s[0]?"i"==s[1]?a=s+" "+n+";":r+="f"==s[1]?m(n,s):s+"{"+m(n,"k"==s[1]?"":t)+"}":"object"==typeof n?r+=m(n,t?t.replace(/([^,])+/g,e=>s.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):s):null!=n&&(s=/^--/.test(s)?s:s.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=m.p?m.p(s,n):s+":"+n+";")}return a+(t&&o?t+"{"+o+"}":o)+r},p={},f=e=>{if("object"==typeof e){let t="";for(let a in e)t+=a+f(e[a]);return t}return e},h=(e,t,a,r,o)=>{var s;let n=f(e),i=p[n]||(p[n]=(e=>{let t=0,a=11;for(;t<e.length;)a=101*a+e.charCodeAt(t++)>>>0;return"go"+a})(n));if(!p[i]){let t=n!==e?e:(e=>{let t,a,r=[{}];for(;t=d.exec(e.replace(c,""));)t[4]?r.shift():t[3]?(a=t[3].replace(u," ").trim(),r.unshift(r[0][a]=r[0][a]||{})):r[0][t[1]]=t[2].replace(u," ").trim();return r[0]})(e);p[i]=m(o?{["@keyframes "+i]:t}:t,a?"":"."+i)}let l=a&&p.g?p.g:null;return a&&(p.g=p[i]),s=p[i],l?t.data=t.data.replace(l,s):-1===t.data.indexOf(s)&&(t.data=r?s+t.data:t.data+s),i},g=(e,t,a)=>e.reduce((e,r,o)=>{let s=t[o];if(s&&s.call){let e=s(a),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;s=t?"."+t:e&&"object"==typeof e?e.props?"":m(e,""):!1===e?"":e}return e+r+(null==s?"":s)},"");function b(e){let t=this||{},a=e.call?e(t.p):e;return h(a.unshift?a.raw?g(a,[].slice.call(arguments,1),t.p):a.reduce((e,a)=>Object.assign(e,a&&a.call?a(t.p):a),{}):a,l(t.target),t.g,t.o,t.k)}b.bind({g:1});let x,v,y,w=b.bind({k:1});function D(e,t){let a=this||{};return function(){let r=arguments;function o(s,n){let i=Object.assign({},s),l=i.className||o.className;a.p=Object.assign({theme:v&&v()},i),a.o=/ *go\d+/.test(l),i.className=b.apply(a,r)+(l?" "+l:""),t&&(i.ref=n);let d=e;return e[0]&&(d=i.as||e,delete i.as),y&&d[0]&&y(i),x(d,i)}return t?t(o):o}}var j=e=>"function"==typeof e,N=(e,t)=>j(e)?e(t):e,E=(r=0,()=>(++r).toString()),A=()=>{if(void 0===o&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");o=!e||e.matches}return o},S=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:a}=t;return S(e,{type:e.toasts.find(e=>e.id===a.id)?1:0,toast:a});case 3:let{toastId:r}=t;return{...e,toasts:e.toasts.map(e=>e.id===r||void 0===r?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+o}))}}},I=[],z={toasts:[],pausedAt:void 0},k=e=>{z=S(z,e),I.forEach(e=>{e(z)})},C=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(null==a?void 0:a.id)||E()}),_=e=>(t,a)=>{let r=C(t,e,a);return k({type:2,toast:r}),r.id},B=(e,t)=>_("blank")(e,t);B.error=_("error"),B.success=_("success"),B.loading=_("loading"),B.custom=_("custom"),B.dismiss=e=>{k({type:3,toastId:e})},B.remove=e=>k({type:4,toastId:e}),B.promise=(e,t,a)=>{let r=B.loading(t.loading,{...a,...null==a?void 0:a.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let o=t.success?N(t.success,e):void 0;return o?B.success(o,{id:r,...a,...null==a?void 0:a.success}):B.dismiss(r),e}).catch(e=>{let o=t.error?N(t.error,e):void 0;o?B.error(o,{id:r,...a,...null==a?void 0:a.error}):B.dismiss(r)}),e};var G=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,U=w`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,$=w`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,O=D("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${G} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${U} 0.15s ease-out forwards;
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
    animation: ${$} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,P=w`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,R=D("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${P} 1s linear infinite;
`,Z=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,q=w`
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
}`,F=D("div")`
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
    animation: ${q} 0.2s ease-out forwards;
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
`,M=D("div")`
  position: absolute;
`,T=D("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,J=w`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,X=D("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${J} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Y=({toast:e})=>{let{icon:t,type:a,iconTheme:r}=e;return void 0!==t?"string"==typeof t?n.createElement(X,null,t):t:"blank"===a?null:n.createElement(T,null,n.createElement(R,{...r}),"loading"!==a&&n.createElement(M,null,"error"===a?n.createElement(O,{...r}):n.createElement(F,{...r})))},L=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,V=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,H=D("div")`
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
`,Q=D("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,W=(e,t)=>{let a=e.includes("top")?1:-1,[r,o]=A()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[L(a),V(a)];return{animation:t?`${w(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};n.memo(({toast:e,position:t,style:a,children:r})=>{let o=e.height?W(e.position||t||"top-center",e.visible):{opacity:0},s=n.createElement(Y,{toast:e}),i=n.createElement(Q,{...e.ariaProps},N(e.message,e));return n.createElement(H,{className:e.className,style:{...o,...a,...e.style}},"function"==typeof r?r({icon:s,message:i}):n.createElement(n.Fragment,null,s,i))}),s=n.createElement,m.p=void 0,x=s,v=void 0,y=void 0,b`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`}},function(e){e.O(0,[844,332,958,888,774,179],function(){return e(e.s=8677)}),_N_E=e.O()}]);