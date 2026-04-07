"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface RatingModalProps {
  onSubmit: (rating: number, comment: string) => void;
  onClose: () => void;
}

export function RatingModal({ onSubmit, onClose }: RatingModalProps) {
  const [rating, setRating] = useState(7);
  const [comment, setComment] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold">Comment était cette conversation ?</h3>
        <p className="mt-1 text-sm text-gray-500">Donne une note de 1 à 10</p>

        <div className="my-6">
          <input
            type="range"
            min={1} max={10}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
          <div className="mt-2 text-center text-3xl font-bold text-brand-600">{rating}/10</div>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Explique pourquoi (optionnel)"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />

        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={() => onSubmit(rating, comment)}>Envoyer</Button>
        </div>
      </div>
    </div>
  );
}
