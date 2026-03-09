import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Item } from '../types/item';
import {
  User,
  Calendar,
  Target,
  Clock,
  TrendingDown,
  BarChart3,
  ShoppingBag,
  Tag,
  Lightbulb,
  Camera,
} from 'lucide-react';

interface ProfileProps {
  items: Item[];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  if (diffDays < 90) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getMostCommonCategory(items: Item[]): string {
  if (items.length === 0) return 'N/A';
  const counts: Record<string, number> = {};
  for (const item of items) {
    const cat = item.category || 'Other';
    counts[cat] = (counts[cat] || 0) + 1;
  }
  let maxCat = 'Other';
  let maxCount = 0;
  for (const [cat, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxCat = cat;
    }
  }
  return maxCat;
}

function getMostMindfulCategory(items: Item[]): string {
  if (items.length === 0) return 'N/A';
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const item of items) {
    const cat = item.category || 'Other';
    sums[cat] = (sums[cat] || 0) + item.consumptionScore;
    counts[cat] = (counts[cat] || 0) + 1;
  }
  let minCat = 'Other';
  let minAvg = Infinity;
  for (const cat of Object.keys(sums)) {
    const avg = sums[cat] / counts[cat];
    if (avg < minAvg) {
      minAvg = avg;
      minCat = cat;
    }
  }
  return minCat;
}

const CATEGORY_COLORS: Record<string, string> = {
  Beauty: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  Clothes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Accessories: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Sports: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Electronics: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  Home: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300',
};

export function Profile({ items }: ProfileProps) {
  const { user, profile, signOut, updateProfilePicture } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const waitingItems = items.filter((item) => {
    if (!item.waitUntilDate) return false;
    return new Date(item.waitUntilDate) > new Date();
  });

  const avgScore = items.length > 0
    ? (items.reduce((sum, item) => sum + item.consumptionScore, 0) / items.length).toFixed(1)
    : '0';

  const mostCommonCategory = getMostCommonCategory(items);
  const mostMindfulCategory = getMostMindfulCategory(items);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  const sortedItems = [...items].sort(
    (a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
  );

  const handleChoosePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image is too large. Please choose one under 2MB.');
      e.target.value = '';
      return;
    }

    setAvatarSaving(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read file.'));
        reader.readAsDataURL(file);
      });
      const { error } = await updateProfilePicture(dataUrl);
      if (error) {
        setAvatarError('Could not update profile photo. Please try again.');
      }
    } catch {
      setAvatarError('Could not read this image. Please try another file.');
    } finally {
      setAvatarSaving(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Profile Header */}
      <div className="bg-card rounded-3xl shadow-lg border border-border p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <button
                type="button"
                onClick={handleChoosePhoto}
                disabled={avatarSaving}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-60"
                title="Change profile picture"
                aria-label="Change profile picture"
              >
                <Camera className="w-4 h-4 text-foreground" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{getDisplayName()}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground mt-1">Member since {memberSince}</p>
              {avatarSaving && (
                <p className="text-xs text-muted-foreground mt-1">Saving profile photo...</p>
              )}
              {avatarError && (
                <p className="text-xs text-destructive mt-1">{avatarError}</p>
              )}
            </div>
          </div>
          <button
            onClick={signOut}
            className="px-6 py-3 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 text-center">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{items.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Items</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 text-center">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-bold text-foreground">{waitingItems.length}</p>
          <p className="text-xs text-muted-foreground mt-1">In Waiting Period</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 text-center">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-5 h-5 text-secondary-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {avgScore}
            <span className="text-sm text-muted-foreground font-normal">/10</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Avg. Score</p>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-5 text-center">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground leading-tight">{mostCommonCategory}</p>
          <p className="text-xs text-muted-foreground mt-1">Most Common Category</p>
        </div>
      </div>

      {/* Patterns */}
      {items.length > 0 && (
        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6">
          <h2 className="text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Your Patterns
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-xl">
              <Tag className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Most Tracked Category</p>
                <p className="text-sm text-muted-foreground">
                  Your most tracked category is{' '}
                  <span className="font-semibold text-foreground">{mostCommonCategory}</span>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-xl">
              <BarChart3 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Average Consumption Score</p>
                <p className="text-sm text-muted-foreground">
                  Your average consumption score is{' '}
                  <span className="font-semibold text-foreground">{avgScore}/10</span>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-xl">
              <TrendingDown className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Most Mindful Category</p>
                <p className="text-sm text-muted-foreground">
                  You've been most mindful about{' '}
                  <span className="font-semibold text-foreground">{mostMindfulCategory}</span>{' '}
                  (lowest avg. score).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {sortedItems.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Your Timeline
          </h2>

          <div className="space-y-4">
            {sortedItems.map((item) => {
              const categoryColor =
                CATEGORY_COLORS[item.category || 'Other'] || CATEGORY_COLORS.Other;

              return (
                <div key={item.id}>
                  <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted/30 shrink-0">
                        {item.imageUrl && item.imageUrl.trim() ? (
                          <img
                            src={item.imageUrl.trim()}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.parentElement) {
                                e.currentTarget.parentElement.classList.add(
                                  'flex',
                                  'items-center',
                                  'justify-center'
                                );
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-medium text-foreground truncate">
                            {item.name}
                          </h3>
                          <span className="text-sm text-muted-foreground shrink-0">
                            {formatTimeAgo(item.addedDate)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor}`}
                          >
                            {item.category || 'Other'}
                          </span>

                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.consumptionScore >= 7
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                : item.consumptionScore >= 4
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}
                          >
                            Score: {item.consumptionScore}/10
                          </span>

                          {item.constraintType === 'time' && item.waitUntilDate && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              Wait until{' '}
                              {new Date(item.waitUntilDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                          {item.constraintType === 'goals' && item.difficulty && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Target className="w-3 h-3" />
                              <span className="capitalize">{item.difficulty} goal</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
