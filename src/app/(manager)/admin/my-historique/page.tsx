import HistoriquePage from "@/app/(employee)/historique/page";

// Le gérant/patron voit son propre historique (mêmes données que l'employé,
// l'API /api/employee/history utilise la personne connectée).
export default function ManagerHistoriquePage() {
  return <HistoriquePage />;
}
