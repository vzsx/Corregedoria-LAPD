export function GovBar() {
  return (
    <div className="bg-[#1A1A1A] text-[11px] border-b border-[#333333]">
      <div className="container mx-auto flex h-8 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <span className="font-medium text-[#D0D0D0]">Governo do Estado de São Paulo</span>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <a href="/" className="text-[#888888] hover:text-[#D0D0D0] transition-colors">Órgãos do Governo</a>
          <a href="/" className="text-[#888888] hover:text-[#D0D0D0] transition-colors">Acesso à Informação</a>
          <a href="/" className="text-[#888888] hover:text-[#D0D0D0] transition-colors">Legislação</a>
          <a href="/" className="text-[#888888] hover:text-[#D0D0D0] transition-colors">Acessibilidade</a>
        </div>
      </div>
    </div>
  );
}
