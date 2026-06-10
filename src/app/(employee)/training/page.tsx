import Link from "next/link";
import { FileText, Video } from "lucide-react";

export default function TrainingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Formation</h1>
        <p className="text-sm text-gray-500">Choisis un type de formation.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/training/texte">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm transition hover:border-gray-300">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-brand-600">
              <FileText className="h-6 w-6" strokeWidth={2} />
            </span>
            <h2 className="text-lg font-semibold text-gray-900">Formation texte</h2>
            <p className="text-sm text-gray-500">Formations à lire et quiz</p>
          </div>
        </Link>

        <Link href="/training/video">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm transition hover:border-gray-300">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-brand-600">
              <Video className="h-6 w-6" strokeWidth={2} />
            </span>
            <h2 className="text-lg font-semibold text-gray-900">Formation vidéo</h2>
            <p className="text-sm text-gray-500">Formations en vidéo</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
