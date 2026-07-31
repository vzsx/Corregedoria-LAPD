export function GovBar() {
  return (
    <div className="bg-pmesp-bar text-[11px] text-[#ADADAD]">
      <div className="container mx-auto flex h-8 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <span className="font-medium text-[#D0D0D0]">Governo do Estado de São Paulo</span>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <a href="/" className="hover:text-[#E8E8E8] transition-colors">Órgãos do Governo</a>
          <a href="/" className="hover:text-[#E8E8E8] transition-colors">Acesso à Informação</a>
          <a href="/" className="hover:text-[#E8E8E8] transition-colors">Legislação</a>
          <a href="/" className="hover:text-[#E8E8E8] transition-colors">Acessibilidade</a>
        </div>
      </div>
    </div>
  );
}
