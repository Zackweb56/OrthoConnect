"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/shared/loading-state";
import {
  FieldError,
  getFieldError,
  RequiredLabel,
} from "@/components/shared/form-fields";
import { ErrorBanner, apiRequest, notifyToast } from "@/components/owner/shared";

const weekdays = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
];

function emptyOpeningHours() {
  return Object.fromEntries(
    weekdays.map(({ key }) => [
      key,
      { isOpen: false, opensAt: null, closesAt: null },
    ]),
  );
}

function emptyProfile() {
  return {
    name: "",
    logoPath: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    timezone: "Africa/Casablanca",
    openingHours: emptyOpeningHours(),
  };
}

function normalizeOpeningHours(value) {
  const defaults = emptyOpeningHours();
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  return Object.fromEntries(
    weekdays.map(({ key }) => {
      const day = value[key];
      return [
        key,
        {
          isOpen: day?.isOpen === true,
          opensAt: typeof day?.opensAt === "string" ? day.opensAt : null,
          closesAt: typeof day?.closesAt === "string" ? day.closesAt : null,
        },
      ];
    }),
  );
}

export function ClinicSettings({ canUpdate }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let active = true;
    apiRequest("/api/cabinet/settings/profile")
      .then(({ clinic }) => {
        if (active) {
          setProfile({
            name: clinic.name ?? "",
            logoPath: clinic.logoPath ?? "",
            phone: clinic.phone ?? "",
            email: clinic.email ?? "",
            address: clinic.address ?? "",
            city: clinic.city ?? "",
            timezone: clinic.timezone ?? "Africa/Casablanca",
            openingHours: normalizeOpeningHours(clinic.openingHours),
          });
        }
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

  async function saveProfile(event) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setIsSaving(true);
    try {
      const { clinic } = await apiRequest("/api/cabinet/settings/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: profile.name,
          logoPath: profile.logoPath || null,
          phone: profile.phone || null,
          email: profile.email || null,
          address: profile.address || null,
          city: profile.city || null,
          timezone: profile.timezone,
          openingHours: profile.openingHours,
        }),
      });
      setProfile({
        name: clinic.name ?? "",
        logoPath: clinic.logoPath ?? "",
        phone: clinic.phone ?? "",
        email: clinic.email ?? "",
        address: clinic.address ?? "",
        city: clinic.city ?? "",
        timezone: clinic.timezone ?? "Africa/Casablanca",
        openingHours: normalizeOpeningHours(clinic.openingHours),
      });
      notifyToast("Les informations du cabinet ont été enregistrées.");
    } catch (requestError) {
      setError(requestError.message);
      setFieldErrors(requestError.fieldErrors ?? {});
      notifyToast(requestError.message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <LoadingState label="Chargement des paramètres…" />;

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold sm:text-2xl">Profil du cabinet</h2>
        <p className="text-sm text-muted">
          Gérez les coordonnées, le logo et les horaires d’ouverture de votre cabinet.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Informations du cabinet</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={saveProfile}
            noValidate
            onChange={() => {
              setError("");
              setFieldErrors({});
            }}
          >
            <ErrorBanner message={error} />
            <ProfileField
              label="Nom du cabinet"
              name="name"
              value={profile.name}
              onChange={updateProfile(setProfile)}
              error={getFieldError(fieldErrors, "name")}
              required
              disabled={!canUpdate}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField
                label="Chemin ou URL du logo"
                name="logoPath"
                value={profile.logoPath}
                onChange={updateProfile(setProfile)}
                error={getFieldError(fieldErrors, "logoPath")}
                placeholder="/logos/cabinet.png"
                disabled={!canUpdate}
              />
              <ProfileField
                label="Fuseau horaire"
                name="timezone"
                value={profile.timezone}
                onChange={updateProfile(setProfile)}
                error={getFieldError(fieldErrors, "timezone")}
                placeholder="Africa/Casablanca"
                required
                disabled={!canUpdate}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField
                label="Téléphone"
                name="phone"
                value={profile.phone}
                onChange={updateProfile(setProfile)}
                error={getFieldError(fieldErrors, "phone")}
                disabled={!canUpdate}
              />
              <ProfileField
                label="Adresse e-mail"
                name="email"
                type="email"
                value={profile.email}
                onChange={updateProfile(setProfile)}
                error={getFieldError(fieldErrors, "email")}
                disabled={!canUpdate}
              />
              <ProfileField
                label="Adresse"
                name="address"
                value={profile.address}
                onChange={updateProfile(setProfile)}
                error={getFieldError(fieldErrors, "address")}
                disabled={!canUpdate}
              />
              <ProfileField
                label="Ville"
                name="city"
                value={profile.city}
                onChange={updateProfile(setProfile)}
                error={getFieldError(fieldErrors, "city")}
                disabled={!canUpdate}
              />
            </div>
            <fieldset className="space-y-3 rounded-xl border border-line p-4">
              <legend className="px-1 text-sm font-semibold">
                Horaires d’ouverture
              </legend>
              <div className="space-y-3">
                {weekdays.map(({ key, label }) => {
                  const hours = profile.openingHours[key];
                  const openingError = getFieldError(
                    fieldErrors,
                    `openingHours.${key}.opensAt`,
                  );
                  const closingError = getFieldError(
                    fieldErrors,
                    `openingHours.${key}.closesAt`,
                  );
                  return (
                    <div
                      key={key}
                      className="grid gap-3 rounded-lg bg-surface-soft/50 p-3 sm:grid-cols-[minmax(7rem,1fr)_auto_minmax(0,1.3fr)] sm:items-center"
                    >
                      <p className="font-medium">{label}</p>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={hours.isOpen}
                          disabled={!canUpdate}
                          onChange={(event) =>
                            updateOpeningDay(setProfile, key, {
                              isOpen: event.target.checked,
                              ...(!event.target.checked
                                ? { opensAt: null, closesAt: null }
                                : {}),
                            })
                          }
                          className="size-4 accent-primary"
                        />
                        Ouvert
                      </label>
                      {hours.isOpen ? (
                        <div className="grid grid-cols-2 gap-3">
                          <TimeField
                            id={`clinic-hours-${key}-opens`}
                            label="Ouverture"
                            value={hours.opensAt ?? ""}
                            disabled={!canUpdate}
                            error={openingError}
                            errorId={`clinic-hours-${key}-opens-error`}
                            onChange={(value) =>
                              updateOpeningDay(setProfile, key, {
                                opensAt: value || null,
                              })
                            }
                          />
                          <TimeField
                            id={`clinic-hours-${key}-closes`}
                            label="Fermeture"
                            value={hours.closesAt ?? ""}
                            disabled={!canUpdate}
                            error={closingError}
                            errorId={`clinic-hours-${key}-closes-error`}
                            onChange={(value) =>
                              updateOpeningDay(setProfile, key, {
                                closesAt: value || null,
                              })
                            }
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-muted">Fermé</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>
            {canUpdate && (
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  <Save aria-hidden="true" />
                  {isSaving ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function ProfileField({
  label,
  name,
  onChange,
  required = false,
  error,
  ...props
}) {
  const id = `clinic-profile-${name}`;
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={id} required={required}>
        {label}
      </RequiredLabel>
      <Input
        id={id}
        name={name}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

function TimeField({
  id,
  label,
  value,
  onChange,
  disabled,
  error,
  errorId,
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs text-muted">
        {label}
      </label>
      <Input
        id={id}
        type="time"
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className="bg-surface text-sm text-fg"
      />
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}

function updateProfile(setProfile) {
  return (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };
}

function updateOpeningDay(setProfile, day, changes) {
  setProfile((current) => ({
    ...current,
    openingHours: {
      ...current.openingHours,
      [day]: { ...current.openingHours[day], ...changes },
    },
  }));
}
