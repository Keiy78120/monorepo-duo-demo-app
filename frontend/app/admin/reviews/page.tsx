"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Star,
  Check,
  X,
  Clock,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/supabase/database.types";

// Mock data
const mockReviews: Review[] = [
  {
    id: "1",
    product_id: null,
    telegram_user_id: "123456789",
    username: "john_doe",
    rating: 5,
    content: "Amazing quality products! The avocados were perfectly ripe and the delivery was super fast. Will definitely order again.",
    status: "published",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "2",
    product_id: null,
    telegram_user_id: "987654321",
    username: "sarah_m",
    rating: 4,
    content: "Great selection of organic produce. The ribeye steak was excellent, though I wish there were more fish options.",
    status: "pending",
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "3",
    product_id: null,
    telegram_user_id: "456789123",
    username: null,
    rating: 5,
    content: "Best sourdough bread I've ever had! Perfectly crusty on the outside and soft inside. The honey is also incredible.",
    status: "pending",
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "4",
    product_id: null,
    telegram_user_id: "789123456",
    username: "foodie_99",
    rating: 2,
    content: "Not impressed. Delivery was late and one item was missing. Customer service was helpful though.",
    status: "pending",
    created_at: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: "5",
    product_id: null,
    telegram_user_id: "321654987",
    username: "organic_lover",
    rating: 5,
    content: "Finally found a reliable source for organic produce! The quality is consistently excellent.",
    status: "rejected",
    created_at: new Date(Date.now() - 432000000).toISOString(),
  },
];

type ReviewStatus = "all" | "pending" | "published" | "rejected";

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-[var(--color-warning)]/10", text: "text-[var(--color-warning)]" },
  published: { bg: "bg-[var(--color-success)]/10", text: "text-[var(--color-success)]" },
  rejected: { bg: "bg-[var(--color-destructive)]/10", text: "text-[var(--color-destructive)]" },
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>("all");

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setReviews(mockReviews);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      !search ||
      review.content.toLowerCase().includes(search.toLowerCase()) ||
      review.username?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || review.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Update review status
  const handleUpdateStatus = async (
    reviewId: string,
    status: "published" | "rejected"
  ) => {
    try {
      // In production, call API
      // await fetch(`/api/reviews/${reviewId}`, {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ status }),
      // });

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status } : r))
      );
    } catch (error) {
      console.error("Failed to update review:", error);
    }
  };

  // Stats
  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    published: reviews.filter((r) => r.status === "published").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Reviews
        </h1>
        <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
          Moderate customer reviews
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-[var(--color-foreground)]" },
          { label: "Pending", value: stats.pending, color: "text-[var(--color-warning)]" },
          { label: "Published", value: stats.published, color: "text-[var(--color-success)]" },
          { label: "Rejected", value: stats.rejected, color: "text-[var(--color-destructive)]" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card rounded-xl p-4 text-center"
          >
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted-foreground)]" />
          <Input
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ReviewStatus)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          ))
        ) : filteredReviews.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-[var(--color-muted-foreground)]">
              No reviews found
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredReviews.map((review, index) => {
              const displayName = review.username
                ? `@${review.username}`
                : `User ${review.telegram_user_id.slice(-4)}`;

              const formattedDate = new Date(review.created_at).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              );

              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-sm font-semibold text-white shrink-0">
                      {(review.username || "U")[0].toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[var(--color-foreground)]">
                            {displayName}
                          </p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "w-3.5 h-3.5",
                                  star <= review.rating
                                    ? "fill-[var(--color-warning)] text-[var(--color-warning)]"
                                    : "text-[var(--color-muted)]"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            statusColors[review.status]?.bg,
                            statusColors[review.status]?.text,
                            "border-0"
                          )}
                        >
                          {review.status === "pending" && (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {review.status.charAt(0).toUpperCase() +
                            review.status.slice(1)}
                        </Badge>
                      </div>

                      {/* Date */}
                      <p className="text-xs text-[var(--color-muted-foreground)] mb-3">
                        {formattedDate}
                      </p>

                      {/* Review Content */}
                      <p className="text-sm text-[var(--color-foreground)] leading-relaxed">
                        {review.content}
                      </p>

                      {/* Actions for pending reviews */}
                      {review.status === "pending" && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            className="bg-[var(--color-success)] hover:bg-[var(--color-success)]/90"
                            onClick={() =>
                              handleUpdateStatus(review.id, "published")
                            }
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleUpdateStatus(review.id, "rejected")
                            }
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
