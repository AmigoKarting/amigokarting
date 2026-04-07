import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!employee) notFound();

  // Progression formation
  const { data: watchLogs } = await supabase
    .from("video_watch_log")
    .select("*, training_videos(title, chapter_id)")
    .eq("employee_id", params.id);

  // Quiz
  const { data: quizAttempts } = await supabase
    .from("quiz_attempts")
    .select("*, quizzes(title)")
    .eq("employee_id", params.id)
    .order("started_at", { ascending: false });

  // Conversations
  let conversations: any[] = [];
  try {
    const { data } = await supabase
      .from("conversation_sessions")
      .select("*")
      .eq("employee_id", params.id)
      .order("started_at", { ascending: false })
      .limit(20);
    conversations = data || [];
  } catch {}

  const totalConvSeconds = conversations.reduce((s: number, c: any) => s + (c.duration_sec || 0), 0);
  const ratingsOnly = conversations.filter((c: any) => c.rating != null);
  const avgRating = ratingsOnly.length > 0
    ? ratingsOnly.reduce((s: number, c: any) => s + c.rating, 0) / ratingsOnly.length
    : null;

  // Info manquante
  const missingFields: string[] = [];
  if (!employee.phone) missingFields.push("Téléphone");
  if (!employee.address) missingFields.push("Adresse");
  if (!employee.city) missingFields.push("Ville");
  if (!employee.postal_code) missingFields.push("Code postal");
  if (!employee.emergency_contact_name) missingFields.push("Contact d'urgence");
  if (!employee.emergency_contact_phone) missingFields.push("Tél. urgence");
  if (!employee.uniform_size_shirt) missingFields.push("Taille chandail");

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/employees" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux employés
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {employee.first_name} {employee.last_name}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              employee.role === "patron"
                ? "bg-yellow-100 text-yellow-700"
                : employee.role === "manager"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-600"
            }`}>
              {employee.role === "patron" ? "👑 Patron" : employee.role === "manager" ? "Gérant" : "Employé"}
            </span>
            {missingFields.length > 0 ? (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                {missingFields.length} info{missingFields.length > 1 ? "s" : ""} manquante{missingFields.length > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Fiche complète
              </span>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>ID : {employee.id.slice(0, 8)}...</p>
          <p>Code : {employee.phone_last4}</p>
        </div>
      </div>

      {/* Alerte champs manquants */}
      {missingFields.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">Informations manquantes :</p>
          <p className="mt-1 text-sm text-red-600">{missingFields.join(", ")}</p>
        </div>
      )}

      {/* Toutes les informations personnelles */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Informations personnelles complètes</h2>
        </div>
        <div className="grid grid-cols-1 gap-0 divide-y sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
          {/* Colonne gauche */}
          <div className="px-6 py-4">
            <h3 className="mb-3 text-xs font-medium uppercase text-gray-400">Coordonnées</h3>
            <dl className="space-y-2.5 text-sm">
              <InfoRow label="Prénom" value={employee.first_name} />
              <InfoRow label="Nom" value={employee.last_name} />
              <InfoRow label="Téléphone" value={employee.phone} required />
              <InfoRow label="Email" value={employee.email} />
              <InfoRow label="Adresse" value={employee.address} required />
              <InfoRow label="Ville" value={employee.city} required />
              <InfoRow label="Code postal" value={employee.postal_code} required />
              <InfoRow label="Province" value={employee.province} />
            </dl>
          </div>
          {/* Colonne droite */}
          <div className="px-6 py-4">
            <h3 className="mb-3 text-xs font-medium uppercase text-gray-400">Urgence & uniforme</h3>
            <dl className="space-y-2.5 text-sm">
              <InfoRow label="Contact urgence" value={employee.emergency_contact_name} required />
              <InfoRow label="Tél. urgence" value={employee.emergency_contact_phone} required />
              <InfoRow label="Taille chandail" value={employee.uniform_size_shirt} required />
            </dl>

            <h3 className="mb-3 mt-6 text-xs font-medium uppercase text-gray-400">Système</h3>
            <dl className="space-y-2.5 text-sm">
              <InfoRow label="Rôle" value={employee.role} />
              <InfoRow label="Code PIN" value={employee.phone_last4} />
              <InfoRow label="Actif" value={employee.is_active ? "Oui" : "Non"} />
              <InfoRow label="Créé le" value={new Date(employee.created_at).toLocaleString("fr-CA")} />
              <InfoRow label="Modifié le" value={new Date(employee.updated_at).toLocaleString("fr-CA")} />
            </dl>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">Vidéos complétées</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">
            {watchLogs?.filter((w) => w.completed).length || 0}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">Quiz réussis</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">
            {quizAttempts?.filter((q) => q.passed).length || 0}
            <span className="text-sm font-normal text-gray-400">
              /{quizAttempts?.length || 0}
            </span>
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">Heures conversation</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">
            {(totalConvSeconds / 3600).toFixed(1)}h
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">Note moyenne</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">
            {avgRating ? avgRating.toFixed(1) : "—"}
            <span className="text-sm font-normal text-gray-400">/10</span>
          </p>
        </div>
      </div>

      {/* Progression vidéos */}
      {watchLogs && watchLogs.length > 0 && (
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Progression des vidéos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-2">Vidéo</th>
                  <th className="px-4 py-2">Regardé</th>
                  <th className="px-4 py-2">Statut</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {watchLogs.map((w: any) => (
                  <tr key={w.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{w.training_videos?.title || "—"}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {Math.floor(w.watched_sec / 60)}:{String(w.watched_sec % 60).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-2">
                      {w.completed ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Complétée</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">En cours</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-400">
                      {w.completed_at
                        ? new Date(w.completed_at).toLocaleDateString("fr-CA")
                        : new Date(w.started_at).toLocaleDateString("fr-CA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historique quiz */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Historique des quiz</h2>
        </div>
        {quizAttempts && quizAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-2">Quiz</th>
                  <th className="px-4 py-2">Score</th>
                  <th className="px-4 py-2">Résultat</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {quizAttempts.map((a: any) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{a.quizzes?.title || "—"}</td>
                    <td className="px-4 py-2 font-medium">{Math.round((a.score || 0) * 100)}%</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {a.passed ? "Réussi" : "Échoué"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-400">
                      {new Date(a.started_at).toLocaleDateString("fr-CA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-6 text-center text-sm text-gray-400">Aucun quiz complété</p>
        )}
      </div>

      {/* Historique conversations */}
      {conversations.length > 0 && (
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Historique des conversations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Durée</th>
                  <th className="px-4 py-2">Note</th>
                  <th className="px-4 py-2">Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c: any) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-2 text-xs">
                      {new Date(c.started_at).toLocaleString("fr-CA")}
                    </td>
                    <td className="px-4 py-2">
                      {c.duration_sec
                        ? `${Math.floor(c.duration_sec / 60)} min`
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {c.rating ? (
                        <span className="font-medium text-orange-600">{c.rating}/10</span>
                      ) : "—"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-2 text-xs text-gray-500">
                      {c.rating_comment || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour une ligne d'info
function InfoRow({ label, value, required = false }: { label: string; value: string | null | undefined; required?: boolean }) {
  const isEmpty = !value || value.trim() === "";
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`text-right font-medium ${isEmpty && required ? "text-red-500" : isEmpty ? "text-gray-300" : "text-gray-900"}`}>
        {isEmpty ? (required ? "Manquant" : "—") : value}
      </dd>
    </div>
  );
}
