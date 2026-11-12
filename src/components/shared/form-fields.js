"use client";

import { useState } from "react";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RequiredFieldsNotice() {
  return (
    <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-muted">
      Les champs marqués d’une étoile rouge <span className="text-danger">*</span> sont obligatoires.
    </p>
  );
}

export function RequiredLabel({ htmlFor, children, required = false }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {children}
      {required && (
        <span className="ms-1 text-danger" aria-hidden="true">
          *
        </span>
      )}
      {required && <span className="sr-only"> (obligatoire)</span>}
    </label>
  );
}

export function PasswordInput({
  id,
  value,
  onChange,
  required,
  autoComplete,
  placeholder = "Saisissez un mot de passe",
  onGenerate,
  ...props
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="pe-20"
        {...props}
      />
      <div className="absolute inset-y-0 end-1 flex items-center">
        {onGenerate && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Générer un mot de passe sécurisé"
            title="Générer un mot de passe sécurisé"
            onClick={onGenerate}
          >
            <RefreshCw aria-hidden="true" />
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          title={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}
