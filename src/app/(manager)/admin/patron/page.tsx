import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthEmployee } from "@/lib/supabase/middleware";
import { redirect } from "next/navigation";
import { Crown, Users, GraduationCap, CheckCircle2, AlertTriangle, ClipboardList, Mic } from "lucide-react";

export default async function PatronPage() {
  const employee = await getAuthEmployee();

  // Seul le patron peut voir cette page
  if (!employee || (employee.role !== "patron" && employee.role !== "developpeur")) redirect("/admin");

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
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1">
              <Crown className="h-4 w-4 text-brand-600" strokeWidth={2} />
              <span className="text-xs font-semibold text-brand-700">ZONE PATRON</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {greeting}, {employee.first_name} !
            </h1>
            <p className="mt-2 max-w-md text-sm text-gray-500 italic">
              « {randomQuote} »
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-4xl font-bold text-brand-600">{totalEmployees || 0}</p>
            <p className="text-xs text-gray-500">employés dans ton équipe</p>
          </div>
        </div>
      </div>

      {/* Stats empire */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Ton équipe</p>
            <Users className="h-5 w-5 text-gray-400" strokeWidth={2} />
          </div>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalEmployees || 0}</p>
          <p className="text-xs text-gray-500">
            {totalManagers || 0} gérant{(totalManagers || 0) > 1 ? "s" : ""} · {((totalEmployees || 0) - (totalManagers || 0) - 1)} employé{((totalEmployees || 0) - (totalManagers || 0) - 1) > 1 ? "s" : ""}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Formation</p>
            <GraduationCap className="h-5 w-5 text-gray-400" strokeWidth={2} />
          </div>
          <p className="mt-1 text-2xl font-bold text-brand-600">{completedVideos || 0}</p>
          <p className="text-xs text-gray-500">vidéos complétées au total</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Quiz</p>
            <CheckCircle2 className="h-5 w-5 text-gray-400" strokeWidth={2} />
          </div>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {quizPassed || 0}
            <span className="text-sm font-normal text-gray-400">/{quizAttempts || 0}</span>
          </p>
          <p className="text-xs text-gray-500">quiz réussis</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Fiches incomplètes</p>
            <AlertTriangle className="h-5 w-5 text-gray-400" strokeWidth={2} />
          </div>
          <p className={`mt-1 text-2xl font-bold ${(missingInfo?.length || 0) > 0 ? "text-red-600" : "text-green-600"}`}>
            {missingInfo?.length || 0}
          </p>
          <p className="text-xs text-gray-500">
            {(missingInfo?.length || 0) === 0 ? "Tout le monde est à jour" : "employés à relancer"}
          </p>
        </div>
      </div>

      {/* Contenu du centre */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Dernières inscriptions */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Dernières inscriptions</h2>
          </div>
          <div className="px-6 py-3">
            {recentEmployees?.map((emp, i) => (
              <div key={i} className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-brand-700">
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(emp.created_at).toLocaleDateString("fr-CA")}
                    </p>
                  </div>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                  emp.role === "patron"
                    ? "bg-amber-50 text-amber-700"
                    : emp.role === "manager"
                      ? "bg-purple-50 text-purple-700"
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
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Raccourcis Patron</h2>
            </div>
            <div className="p-4">
              <a href="/admin/employees" className="flex items-center gap-4 rounded-lg p-3 transition hover:bg-gray-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <Users className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Gérer les employés</p>
                  <p className="text-xs text-gray-500">Voir les fiches, changer les rôles</p>
                </div>
              </a>

              <a href="/admin/training" className="flex items-center gap-4 rounded-lg p-3 transition hover:bg-gray-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-brand-600">
                  <GraduationCap className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Suivre la formation</p>
                  <p className="text-xs text-gray-500">Progression de chaque employé</p>
                </div>
              </a>

              <a href="/admin/training/quizzes" className="flex items-center gap-4 rounded-lg p-3 transition hover:bg-gray-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <ClipboardList className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Résultats des quiz</p>
                  <p className="text-xs text-gray-500">Questions les plus difficiles</p>
                </div>
              </a>

              <a href="/admin/conversations" className="flex items-center gap-4 rounded-lg p-3 transition hover:bg-gray-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <Mic className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Rapport conversations</p>
                  <p className="text-xs text-gray-500">Heures et notes par employé</p>
                </div>
              </a>
            </div>
          </div>

          {/* Message du jour */}
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 text-center">
            <Crown className="mx-auto h-6 w-6 text-brand-600" strokeWidth={2} />
            <p className="mt-2 text-sm font-semibold text-brand-700">
              Amigo Karting, c'est ton empire.
            </p>
            <p className="mt-1 text-xs text-brand-600">
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
