import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";
import { redirect } from "next/navigation";

export default async function PatronPage() {
  const employee = await getAuthEmployee();

  // Seul le patron peut voir cette page
  if (!employee || employee.role !== "patron") redirect("/admin");

  const supabase = createServerSupabaseClient();

  // Stats globales
  const { count: totalEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: totalManagers } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("role", "manager")
    .eq("is_active", true);

  const { data: missingInfo } = await supabase
    .from("employee_missing_info")
    .select("*")
    .eq("has_missing_info", true);

  const { count: totalVideos } = await supabase
    .from("training_videos")
    .select("*", { count: "exact", head: true });

  const { count: totalQuizzes } = await supabase
    .from("quizzes")
    .select("*", { count: "exact", head: true });

  const { count: completedVideos } = await supabase
    .from("video_watch_log")
    .select("*", { count: "exact", head: true })
    .eq("completed", true);

  const { count: quizAttempts } = await supabase
    .from("quiz_attempts")
    .select("*", { count: "exact", head: true });

  const { count: quizPassed } = await supabase
    .from("quiz_attempts")
    .select("*", { count: "exact", head: true })
    .eq("passed", true);

  // Derniers employés inscrits
  const { data: recentEmployees } = await supabase
    .from("employees")
    .select("first_name, last_name, role, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bon matin" : hour < 18 ? "Bon après-midi" : "Bonne soirée";

  // Citations motivationnelles random
  const quotes = [
    "Le succès, c'est tomber sept fois et se relever huit.",
    "Un bon leader crée d'autres leaders, pas des suiveurs.",
    "La vitesse, c'est pas juste sur la piste — c'est dans l'exécution.",
    "Ton équipe est ton plus grand investissement.",
    "Chaque employé bien formé, c'est un client satisfait de plus.",
    "Le karting, c'est sérieux. Mais on a le droit d'avoir du fun.",
    "On bâtit pas un empire en restant dans les stands.",
  ];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="space-y-6">
      {/* En-tête Patron */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-3 py-1">
              <span className="text-sm">👑</span>
              <span className="text-xs font-semibold text-yellow-400">ZONE PATRON</span>
            </div>
            <h1 className="text-2xl font-bold">
              {greeting}, {employee.first_name} !
            </h1>
            <p className="mt-2 max-w-md text-sm text-gray-400 italic">
              « {randomQuote} »
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-4xl font-bold text-yellow-400">{totalEmployees || 0}</p>
            <p className="text-xs text-gray-400">employés dans ton équipe</p>
          </div>
        </div>
      </div>

      {/* Stats empire */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Ton équipe</p>
            <span className="text-lg">👥</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalEmployees || 0}</p>
          <p className="text-xs text-gray-400">
            {totalManagers || 0} gérant{(totalManagers || 0) > 1 ? "s" : ""} · {((totalEmployees || 0) - (totalManagers || 0) - 1)} employé{((totalEmployees || 0) - (totalManagers || 0) - 1) > 1 ? "s" : ""}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Formation</p>
            <span className="text-lg">🎓</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-orange-600">{completedVideos || 0}</p>
          <p className="text-xs text-gray-400">vidéos complétées au total</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Quiz</p>
            <span className="text-lg">✅</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {quizPassed || 0}
            <span className="text-sm font-normal text-gray-400">/{quizAttempts || 0}</span>
          </p>
          <p className="text-xs text-gray-400">quiz réussis</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Fiches incomplètes</p>
            <span className="text-lg">⚠️</span>
          </div>
          <p className={`mt-1 text-2xl font-bold ${(missingInfo?.length || 0) > 0 ? "text-red-600" : "text-green-600"}`}>
            {missingInfo?.length || 0}
          </p>
          <p className="text-xs text-gray-400">
            {(missingInfo?.length || 0) === 0 ? "Tout le monde est à jour" : "employés à relancer"}
          </p>
        </div>
      </div>

      {/* Contenu du centre */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Dernières inscriptions */}
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Dernières inscriptions</h2>
          </div>
          <div className="px-6 py-3">
            {recentEmployees?.map((emp, i) => (
              <div key={i} className="flex items-center justify-between border-b border-gray-50 py-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(emp.created_at).toLocaleDateString("fr-CA")}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  emp.role === "patron"
                    ? "bg-yellow-100 text-yellow-700"
                    : emp.role === "manager"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-600"
                }`}>
                  {emp.role === "patron" ? "Patron" : emp.role === "manager" ? "Gérant" : "Employé"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Raccourcis Patron */}
        <div className="space-y-3">
          <div className="rounded-xl bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Raccourcis Patron</h2>
            </div>
            <div className="p-4">
              <a href="/admin/employees" className="flex items-center gap-4 rounded-lg p-3 transition hover:bg-gray-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <span className="text-lg">👥</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Gérer les employés</p>
                  <p className="text-xs text-gray-400">Voir les fiches, changer les rôles</p>
                </div>
              </a>

              <a href="/admin/training" className="flex items-center gap-4 rounded-lg p-3 transition hover:bg-gray-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <span className="text-lg">📊</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Suivre la formation</p>
                  <p className="text-xs text-gray-400">Progression de chaque employé</p>
                </div>
              </a>

              <a href="/admin/training/quizzes" className="flex items-center gap-4 rounded-lg p-3 transition hover:bg-gray-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <span className="text-lg">📝</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Résultats des quiz</p>
                  <p className="text-xs text-gray-400">Questions les plus difficiles</p>
                </div>
              </a>

              <a href="/admin/conversations" className="flex items-center gap-4 rounded-lg p-3 transition hover:bg-gray-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <span className="text-lg">🎙️</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Rapport conversations</p>
                  <p className="text-xs text-gray-400">Heures et notes par employé</p>
                </div>
              </a>
            </div>
          </div>

          {/* Message du jour */}
          <div className="rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-6 text-center">
            <span className="text-3xl">🏎️</span>
            <p className="mt-2 text-sm font-semibold text-yellow-800">
              Amigo Karting, c'est ton empire.
            </p>
            <p className="mt-1 text-xs text-yellow-600">
              {totalEmployees || 0} personnes comptent sur toi.
              {(missingInfo?.length || 0) > 0
                ? ` ${missingInfo?.length} fiches à compléter.`
                : " Toutes les fiches sont à jour."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
