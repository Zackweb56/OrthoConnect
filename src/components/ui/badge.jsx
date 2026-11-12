import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 aria-invalid:border-danger aria-invalid:ring-danger/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-primary/10 bg-primary/10 text-primary [a]:hover:bg-primary/20",
        primary: "border-primary/10 bg-primary/10 text-primary [a]:hover:bg-primary/20",
        success: "border-success/10 bg-success/10 text-success [a]:hover:bg-success/20",
        danger: "border-danger/10 bg-danger/10 text-danger [a]:hover:bg-danger/20",
        warning: "border-warning/10 bg-warning/10 text-warning [a]:hover:bg-warning/20",
        info: "border-info/10 bg-info/10 text-info [a]:hover:bg-info/20",
        secondary:
          "bg-surface-soft text-fg [a]:hover:bg-surface",
        destructive:
          "border-danger/20 bg-danger/10 text-danger focus-visible:ring-danger/20 [a]:hover:bg-danger/20",
        outline:
          "border-line text-fg [a]:hover:bg-surface-soft [a]:hover:text-muted",
        ghost:
          "hover:bg-surface-soft hover:text-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props} />
  );
}

export { Badge, badgeVariants }
