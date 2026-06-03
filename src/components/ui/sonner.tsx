import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group font-sans"
      position="bottom-right"
      closeButton
      expand={true}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:border group-[.toaster]:font-sans group-[.toaster]:text-sm transition-all duration-300",
          success:
            "group-[.toast]:border-l-4 group-[.toast]:border-l-emerald-500 group-[.toast]:bg-emerald-500/5",
          error:
            "group-[.toast]:border-l-4 group-[.toast]:border-l-accent group-[.toast]:bg-accent/5",
          info: "group-[.toast]:border-l-4 group-[.toast]:border-l-primary group-[.toast]:bg-primary/5",
          warning:
            "group-[.toast]:border-l-4 group-[.toast]:border-l-amber-500 group-[.toast]:bg-amber-500/5",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs mt-1",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl group-[.toast]:font-semibold group-[.toast]:px-3 group-[.toast]:py-1.5",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl group-[.toast]:font-semibold group-[.toast]:px-3 group-[.toast]:py-1.5",
          closeButton:
            "group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border-border group-[.toast]:hover:bg-muted group-[.toast]:transition-colors",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
