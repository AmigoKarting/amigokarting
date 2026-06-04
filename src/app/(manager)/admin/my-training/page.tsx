import Link from "next/link";
import { FileText, Video } from "lucide-react";

export default function ManagerTrainingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ma formation</h1>
        <p className="text-sm text-gray-500">Choisis un type de formation.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/my-training/texte">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-sm transition hover:shadow-md">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <FileText className="h-8 w-8 text-orange-500" />
            </span>
            <h2 className="text-lg font-semibold text-gray-900">Formation texte</h2>
            <p className="text-sm text-gray-500">Formations à lire et quiz</p>
          </div>
        </Link>

        <Link href="/admin/my-training/video">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-sm transition hover:shadow-md">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Video className="h-8 w-8 text-orange-500" />
            </span>
            <h2 className="text-lg font-semibold text-gray-900">Formation vidéo</h2>
            <p className="text-sm text-gray-500">Formations en vidéo</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
