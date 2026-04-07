import { z } from "zod";

export const employeeProfileSchema = z.object({
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  address: z.string().min(5, "Adresse requise"),
  city: z.string().min(2, "Ville requise"),
  postal_code: z.string().regex(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, "Code postal invalide"),
  province: z.string().default("QC"),
  emergency_contact_name: z.string().min(2, "Nom du contact d'urgence requis"),
  emergency_contact_phone: z.string().min(10, "Numéro du contact d'urgence requis"),
  uniform_size_shirt: z.string().min(1, "Grandeur de chandail requise"),
  uniform_size_pants: z.string().optional(),
  uniform_size_shoes: z.string().optional(),
});

export const loginSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  pin: z.string().length(4, "4 chiffres requis").regex(/^\d{4}$/, "Chiffres seulement"),
});

export const quizAnswerSchema = z.object({
  quizId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    choiceId: z.string().uuid(),
  })),
});
