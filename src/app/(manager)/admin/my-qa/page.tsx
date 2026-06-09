import EmployeeQAPage from "@/app/(employee)/qa/page";

// La page Q&A du menu admin réutilise exactement la page Q&A employé,
// pour éviter toute divergence (les deux restent toujours synchronisées).
export default function ManagerQAPage() {
  return <EmployeeQAPage />;
}
