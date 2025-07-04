import { useState } from "react";

function ProtocolosSection() {
  const [open, setOpen] = useState(false);
  const pdf =
    "https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets//AVIBAQ%20-%20CheckList%20Voo%20(revisado).pdf";

  return (
    <section className="mt-12 mb-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-black/5 px-8 py-10 space-y-5">
          {/* título + subtítulo */}
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-semibold">
              Protocolos de Segurança – AVIBAQ
            </h2>
            <article className="prose prose-slate text-[15px] sm:text-base leading-relaxed mx-auto">
              <p className="text-sm text-gray-600">
                Versão aprimorada de rotinas operacionais e checklist para voos em Praia&nbsp;Grande/SC.
              </p>
            </article>
          </div>

          {/* mini-preview */}
          <button
            onClick={() => setOpen(true)}
            className="w-full max-h-[220px] overflow-hidden ring-1 ring-black/5 rounded-lg hover:ring-primary transition"
            aria-label="Abrir visualização ampliada dos protocolos"
          >
            <iframe
              src={`${pdf}#page=1&zoom=110&toolbar=0&navpanes=0`}
              title="Pré-visualização PDF"
              className="w-full h-[220px] pointer-events-none"
            />
          </button>

          {/* botões */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href={pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full
                         bg-primary text-white hover:bg-primary2 transition-colors
                         text-sm font-medium text-center"
            >
              Baixar PDF
            </a>

            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full
                         ring-1 ring-primary text-primary hover:bg-primary hover:text-white
                         transition-colors text-sm font-medium"
            >
              Ver em tela cheia
            </button>
          </div>
        </div>
      </div>

      {/* modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full h-[80vh] relative">
            <iframe
              src={`${pdf}#toolbar=1`}
              title="Protocolos de Segurança completo"
              className="w-full h-full rounded-xl"
            />
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar visor PDF"
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProtocolosSection; 