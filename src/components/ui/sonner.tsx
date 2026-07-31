import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#2A2A2A] group-[.toaster]:text-[#D0D0D0] group-[.toaster]:border-[#333333] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[#888888]",
          actionButton: "group-[.toast]:bg-[#7A0000] group-[.toast]:text-[#D0D0D0]",
          cancelButton: "group-[.toast]:bg-[#333333] group-[.toast]:text-[#888888]",
          success: "group-[.toast]:border-emerald-500/30",
          error: "group-[.toast]:border-red-500/30",
          info: "group-[.toast]:border-blue-500/30",
          warning: "group-[.toast]:border-amber-500/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
