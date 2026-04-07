import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSMS(to: string, message: string) {
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  });
}

export function buildAgendrixReminder(startDate: string, endDate: string) {
  return `[Amigo Karting] Il te reste 6h pour déposer tes indisponibilités dans Agendrix pour la prochaine période de paie du ${startDate} au ${endDate}.`;
}

export function buildMissingInfoReminder(missingFields: string[]) {
  const fields = missingFields.join(", ");
  return `[Amigo Karting] Hey! Il me manque les infos suivantes dans ta fiche : ${fields}. Connecte-toi sur le portail pour les remplir.`;
}
