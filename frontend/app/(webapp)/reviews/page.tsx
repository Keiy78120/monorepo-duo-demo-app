"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { MessageSquare, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewCard, StarRatingInput } from "@/components/ReviewCard";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useTelegramStore, useHapticFeedback } from "@/lib/store/telegram";
import type { Review } from "@/lib/supabase/database.types";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { userId, username, initData } = useTelegramStore();
  const { impact, notification } = useHapticFeedback();

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch("/api/reviews?status=published");
        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const data = await response.json();
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      } catch (error) {
        console.error("Échec du chargement des avis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setSubmitting(true);
    impact("medium");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          content: content.trim(),
          initData: initData || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      const data = await response.json();
      const newReview: Review = data.review;
      setReviews([newReview, ...reviews]);
      setContent("");
      setRating(5);
      setShowForm(false);
      notification("success");
    } catch (error) {
      console.error("Échec de l'envoi de l'avis:", error);
      notification("error");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate average rating
  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="px-5 pt-6">
      <PageHeader title="Avis" subtitle={`${reviews.length} avis clients`} />

      {/* Stats */}
      {!loading && reviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-[var(--color-foreground)]">
                {avgRating}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(Number(avgRating))
                        ? "fill-[var(--color-warning)] text-[var(--color-warning)]"
                        : "text-[var(--color-muted)]"
                    }`}
                  />
                ))}
              </div>
            </div>
            <Button
              variant="glass"
              onClick={() => {
                impact("light");
                setShowForm(!showForm);
              }}
            >
              Donner un avis
            </Button>
          </div>
        </motion.div>
      )}


      {/* Review Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="glass-card rounded-2xl p-5 mb-6"
        >
          <h3 className="font-semibold text-[var(--color-foreground)] mb-4">
            Votre avis
          </h3>

          <div className="mb-4">
            <p className="text-sm text-[var(--color-muted-foreground)] mb-2">
              Note
            </p>
            <StarRatingInput value={rating} onChange={setRating} />
          </div>

          <div className="mb-4">
            <p className="text-sm text-[var(--color-muted-foreground)] mb-2">
              Votre commentaire
            </p>
            <Textarea
              placeholder="Partagez votre expérience..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className="flex-1"
              variant="success"
            >
              {submitting ? (
                "Envoi..."
              ) : (
                <>
                  Envoyer
                  <Send className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-[var(--color-muted-foreground)] text-center mt-3">
            Votre avis sera visible après modération
          </p>
        </motion.div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3 p-5 rounded-2xl bg-[var(--color-glass)]">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Aucun avis pour le moment"
          description="Soyez le premier à partager votre expérience !"
          action={{
            label: "Donner un avis",
            onClick: () => setShowForm(true),
          }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {reviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} index={index} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
