import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      closeButton
      gap={10}
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-[14px] group-[.toaster]:border group-[.toaster]:border-border/70 group-[.toaster]:bg-background/95 group-[.toaster]:text-foreground group-[.toaster]:shadow-[0_10px_30px_-12px_rgb(15_23_42/0.28)] group-[.toaster]:backdrop-blur",
          title: "group-[.toast]:text-[0.875rem] group-[.toast]:font-semibold",
          description:
            "group-[.toast]:text-[0.8125rem] group-[.toast]:leading-relaxed group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:rounded-lg group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:rounded-lg group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:rounded-full group-[.toast]:border-border/70 group-[.toast]:bg-background group-[.toast]:text-muted-foreground hover:group-[.toast]:text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
