import { z } from "zod";

export function formatZodError(error) {
  const fieldErrors = {};
  const formErrors = [];

  for (const issue of error.issues ?? []) {
    const path = issue.path.join(".");
    const messages = path ? fieldErrors[path] ?? (fieldErrors[path] = []) : formErrors;
    messages.push(localizeZodIssue(issue));
  }

  return { fieldErrors, formErrors };
}

function localizeZodIssue(issue) {
  const defaultMessage =
    /^(Invalid|Too small|Too big|Expected|Unrecognized|No match)/.test(
      issue.message ?? "",
    );
  if (!defaultMessage) return issue.message;

  if (issue.code === "invalid_type") {
    if (issue.input === undefined) return "Ce champ est obligatoire.";
    return "Le format de cette valeur est invalide.";
  }
  if (issue.code === "invalid_format") {
    const formats = {
      email: "Saisissez une adresse e-mail valide.",
      url: "Saisissez une URL valide.",
      regex: "La valeur ne respecte pas le format attendu.",
    };
    return formats[issue.format] ?? "Le format de cette valeur est invalide.";
  }
  if (issue.code === "too_small") {
    if (issue.origin === "string") {
      return `Ce champ doit contenir au moins ${issue.minimum} caractère${issue.minimum > 1 ? "s" : ""}.`;
    }
    if (issue.origin === "array") {
      return `Sélectionnez au moins ${issue.minimum} élément${issue.minimum > 1 ? "s" : ""}.`;
    }
    return `La valeur doit être supérieure ou égale à ${issue.minimum}.`;
  }
  if (issue.code === "too_big") {
    if (issue.origin === "string") {
      return `Ce champ ne peut pas dépasser ${issue.maximum} caractère${issue.maximum > 1 ? "s" : ""}.`;
    }
    if (issue.origin === "array") {
      return `Sélectionnez au maximum ${issue.maximum} élément${issue.maximum > 1 ? "s" : ""}.`;
    }
    return `La valeur doit être inférieure ou égale à ${issue.maximum}.`;
  }
  if (issue.code === "invalid_value") {
    return "La valeur sélectionnée n’est pas valide.";
  }
  if (issue.code === "unrecognized_keys") {
    return "La requête contient un champ non reconnu.";
  }
  return "Vérifiez la valeur saisie.";
}

export const strongPasswordSchema = z
  .string()
  .min(12, "Le mot de passe doit contenir au moins 12 caractères.")
  .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
    message: "Le mot de passe ne peut pas dépasser 72 octets.",
  })
  .regex(/[a-z]/, "Ajoutez une lettre minuscule.")
  .regex(/[A-Z]/, "Ajoutez une lettre majuscule.")
  .regex(/[0-9]/, "Ajoutez un chiffre.")
  .regex(/[^A-Za-z0-9]/, "Ajoutez un symbole.");

export function decimalAmountSchema({ min = 0 } = {}) {
  return z
    .union([
      z.number().finite().refine((value) => Math.round(value * 100) / 100 === value),
      z
        .string()
        .trim()
        .regex(/^\d+(?:\.\d{1,2})?$/, "Utilisez au maximum deux décimales.")
        .transform(Number),
    ])
    .pipe(z.number().finite().min(min).max(99999999.99));
}

export const wholeNumberSchema = z
  .union([
    z.number().int(),
    z.string().regex(/^\d+$/).transform(Number),
  ])
  .pipe(z.number().int().min(0));
