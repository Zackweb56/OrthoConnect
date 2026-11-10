"use client";

import * as React from "react";
import { Toast as ToastPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "cn";

const ToastProvider = ToastPrimitive.Provider;

function ToastViewport({ className, ...props }) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        "fixed inset-x-0 top-0 z-[100] flex max-h-screen flex-col gap-2 p-4 sm:inset-x-auto sm:end-0 sm:bottom-0 sm:top-auto sm:w-full sm:max-w-sm",
        className,
      )}
      {...props}
    />
  );
}

function Toast({ className, ...props }) {
  return (
    <ToastPrimitive.Root
      className={cn(
        "pointer-events-auto flex w-full items-center justify-between gap-4 overflow-hidden rounded-lg border border-line bg-surface p-4 text-fg shadow-lg ring-1 ring-fg/10 transition-opacity data-[state=closed]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }) {
  return (
    <ToastPrimitive.Title
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  );
}

function ToastDescription({ className, ...props }) {
  return (
    <ToastPrimitive.Description
      className={cn("text-sm text-muted", className)}
      {...props}
    />
  );
}

function ToastAction({ className, ...props }) {
  return (
    <ToastPrimitive.Action
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-line px-3 text-sm font-medium hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

function ToastClose({ className, ...props }) {
  return (
    <ToastPrimitive.Close
      aria-label="Close notification"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-soft hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      <X className="size-4" aria-hidden="true" />
    </ToastPrimitive.Close>
  );
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
};
