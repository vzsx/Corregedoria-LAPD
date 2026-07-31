import { X, Download, Printer, ZoomIn, ZoomOut } from "lucide-react";
import { useState, useRef } from "react";

interface DocumentPreviewProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  type?: "portaria" | "relatorio" | "depoimento" | "denuncia" | "generico";
}

export function DocumentPreview({ open, onClose, title, content, type = "generico" }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.15; margin: 3cm 2cm; }
              h1, h2, h3 { font-weight: bold; }
              p { margin: 0 0 8px 0; }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex flex-col rounded-xl border border-[#333333] bg-[#1E1E1E] shadow-2xl w-[90vw] max-w-4xl h-[85vh] animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333333] px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-[#D0D0D0]">{title}</h3>
            <p className="text-[10px] text-[#666666] mt-0.5 uppercase tracking-wider">
              Pré-visualização do documento
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.max(50, z - 10))}
              className="rounded-md border border-[#333333] bg-[#2A2A2A] p-1.5 text-[#888888] hover:text-[#D0D0D0] hover:bg-[#333333] transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-[10px] text-[#888888] tabular-nums w-10 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(z => Math.min(200, z + 10))}
              className="rounded-md border border-[#333333] bg-[#2A2A2A] p-1.5 text-[#888888] hover:text-[#D0D0D0] hover:bg-[#333333] transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-[#333333] mx-1" />
            <button
              onClick={handlePrint}
              className="rounded-md border border-[#333333] bg-[#2A2A2A] p-1.5 text-[#888888] hover:text-[#D0D0D0] hover:bg-[#333333] transition-colors"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-md border border-[#333333] bg-[#2A2A2A] p-1.5 text-[#888888] hover:text-[#D0D0D0] hover:bg-[#333333] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Document content */}
        <div className="flex-1 overflow-auto p-8">
          <div
            className="mx-auto bg-white shadow-2xl rounded-sm"
            style={{ maxWidth: `${(816 * zoom) / 100}px`, transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            <div
              ref={contentRef}
              className="p-[3cm_2cm] font-[Arial] text-[11pt] leading-[1.15] text-black"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
