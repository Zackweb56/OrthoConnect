"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/shared/loading-state";
import {
  FieldError,
  getFieldError,
  PasswordInput,
  RequiredLabel,
} from "@/components/shared/form-fields";
import { ErrorBanner, apiRequest, notifyToast } from "@/components/owner/shared";

const emptyUser = { name: "", email: "" };
const emptyPasswords = {
  currentPassword: "",
  password: "",
  confirmPassword: "",
};

export function AccountSettings() {
  const router = useRouter();
  const [user, setUser] = useState(emptyUser);
  const [passwords, setPasswords] = useState(emptyPasswords);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest("/api/cabinet/account/profile")
      .then(({ user: profile }) => {
        if (active) setUser({ name: profile.name ?? "", email: profile.email ?? "" });
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateUser(event) {
    const { name, value } = event.target;
    setUser((current) => ({ ...current, [name]: value }));
  }

  function updatePassword(event) {
    const { name, value } = event.target;
    setPasswords((current) => ({ ...current, [name]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setIsSaving(true);
    try {
      const body = { ...user };
      if (Object.values(passwords).some(Boolean)) Object.assign(body, passwords);
      const { user: savedUser } = await apiRequest(
        "/api/cabinet/account/profile",
        { method: "PATCH", body: JSON.stringify(body) },
      );
      setUser({ name: savedUser.name ?? "", email: savedUser.email ?? "" });
      setPasswords(emptyPasswords);
      notifyToast("Votre profil a été mis à jour.");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
      setFieldErrors(requestError.fieldErrors ?? {});
      notifyToast(requestError.message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState label="Chargement de votre profil…" />;

  return (
    <section className="space-y-5">
      <header>
        <h2 className="text-xl font-semibold sm:text-2xl">Mon profil</h2>
        <p className="text-sm text-muted">
          Modifiez les informations de votre compte et votre mot de passe.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={saveProfile}
            noValidate
            onChange={() => {
              setError("");
              setFieldErrors({});
            }}
          >
            <ErrorBanner message={error} />
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField
                label="Nom d’utilisateur"
                name="name"
                autoComplete="name"
                required
                value={user.name}
                onChange={updateUser}
                error={getFieldError(fieldErrors, "name")}
              />
              <ProfileField
                label="Adresse e-mail"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={user.email}
                onChange={updateUser}
                error={getFieldError(fieldErrors, "email")}
              />
            </div>
            <fieldset className="space-y-4 rounded-xl border border-line p-4">
              <legend className="px-1 text-sm font-semibold">
                Changer le mot de passe
              </legend>
              <p className="text-sm text-muted">
                Laissez ces champs vides si vous ne souhaitez pas le modifier.
              </p>
              <PasswordField
                label="Mot de passe actuel"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={updatePassword}
                autoComplete="current-password"
                error={getFieldError(fieldErrors, "currentPassword")}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordField
                  label="Nouveau mot de passe"
                  name="password"
                  value={passwords.password}
                  onChange={updatePassword}
                  autoComplete="new-password"
                  error={getFieldError(fieldErrors, "password")}
                >
                  Au moins 12 caractères avec une minuscule, une majuscule, un
                  chiffre et un symbole (72 octets maximum).
                </PasswordField>
                <PasswordField
                  label="Confirmer le nouveau mot de passe"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={updatePassword}
                  autoComplete="new-password"
                  error={getFieldError(fieldErrors, "confirmPassword")}
                />
              </div>
            </fieldset>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                <Save aria-hidden="true" />
                {isSaving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function ProfileField({ label, name, error, ...props }) {
  const id = `account-profile-${name}`;
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={id} required={props.required}>
        {label}
      </RequiredLabel>
      <Input
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

function PasswordField({
  label,
  name,
  value,
  onChange,
  autoComplete,
  error,
  children,
}) {
  const id = `account-password-${name}`;
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={id}>{label}</RequiredLabel>
      <PasswordInput
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [children ? `${id}-hint` : null, error ? `${id}-error` : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
      {children && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {children}
        </p>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
