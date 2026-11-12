"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { LoaderCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput, RequiredLabel } from "@/components/shared/form-fields";

export function LoginForm() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: event.currentTarget.email.value,
        password: event.currentTarget.password.value,
        redirect: false,
        redirectTo: "/redirect",
      });

      if (result?.error) {
        setError("Email ou mot de passe invalide.");
        return;
      }

      window.location.assign(result?.url ?? "/redirect");
    } catch {
      setError("La connexion a échoué. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <RequiredLabel htmlFor="email" required>
          Adresse e-mail
        </RequiredLabel>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nom@cabinet.ma"
          required
        />
      </div>
      <div className="space-y-2">
        <RequiredLabel htmlFor="password" required>
          Mot de passe
        </RequiredLabel>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="Saisissez votre mot de passe"
          required
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        ) : (
          <LogIn aria-hidden="true" />
        )}
        {isSubmitting ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
