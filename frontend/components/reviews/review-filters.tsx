// frontend/components/reviews/review-filters.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReviewFiltersProps {
  onFilterChange: (filters: {
    sortBy: string;
    minRating?: number;
    maxRating?: number;
    spoilersOnly?: boolean;
    noSpoilers?: boolean;
  }) => void;
}

export function ReviewFilters({ onFilterChange }: ReviewFiltersProps) {
  const [sortBy, setSortBy] = useState('recent');
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 10]);
  const [spoilersOnly, setSpoilersOnly] = useState(false);
  const [noSpoilers, setNoSpoilers] = useState(false);
  const [open, setOpen] = useState(false);

  const applyFilters = () => {
    const filters: any = {
      sortBy,
    };

    if (ratingRange[0] > 0 || ratingRange[1] < 10) {
      filters.minRating = ratingRange[0];
      filters.maxRating = ratingRange[1];
    }

    if (spoilersOnly) filters.spoilersOnly = true;
    if (noSpoilers) filters.noSpoilers = true;

    onFilterChange(filters);
    setOpen(false);
  };

  const resetFilters = () => {
    setSortBy('recent');
    setRatingRange([0, 10]);
    setSpoilersOnly(false);
    setNoSpoilers(false);
    onFilterChange({ sortBy: 'recent' });
  };

  const hasActiveFilters =
    sortBy !== 'recent' ||
    ratingRange[0] > 0 ||
    ratingRange[1] < 10 ||
    spoilersOnly ||
    noSpoilers;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter & Sort
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter Reviews</SheetTitle>
          <SheetDescription>
            Customize how reviews are displayed
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Sort By */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="rating_high">Highest Rated</SelectItem>
                <SelectItem value="rating_low">Lowest Rated</SelectItem>
                <SelectItem value="most_liked">Most Liked</SelectItem>
                <SelectItem value="most_discussed">Most Discussed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rating Range */}
          <div className="space-y-3">
            <Label>Rating Range</Label>
            <div className="pt-2">
              <Slider
                value={ratingRange}
                onValueChange={(value) => setRatingRange(value as [number, number])}
                min={0}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{ratingRange[0]}/10</span>
              <span>{ratingRange[1]}/10</span>
            </div>
          </div>

          {/* Spoiler Filters */}
          <div className="space-y-4">
            <Label>Spoiler Preferences</Label>

            <div className="flex items-center justify-between">
              <Label htmlFor="spoilers-only" className="font-normal cursor-pointer">
                Only show reviews with spoilers
              </Label>
              <Switch
                id="spoilers-only"
                checked={spoilersOnly}
                onCheckedChange={(checked) => {
                  setSpoilersOnly(checked);
                  if (checked) setNoSpoilers(false);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="no-spoilers" className="font-normal cursor-pointer">
                Hide reviews with spoilers
              </Label>
              <Switch
                id="no-spoilers"
                checked={noSpoilers}
                onCheckedChange={(checked) => {
                  setNoSpoilers(checked);
                  if (checked) setSpoilersOnly(false);
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-6">
          <Button onClick={applyFilters} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={resetFilters} size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}