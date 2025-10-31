// frontend/components/feed/feed-filters.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter } from 'lucide-react';

interface FeedFiltersProps {
  onFilterChange: (filters: {
    types: string[];
    sortBy: 'recent' | 'popular';
  }) => void;
}

export function FeedFilters({ onFilterChange }: FeedFiltersProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'review',
    'follow',
    'watchlist',
    'like',
  ]);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  const activityTypes = [
    { value: 'review', label: 'Reviews' },
    { value: 'follow', label: 'Follows' },
    { value: 'watchlist', label: 'Watchlist Updates' },
    { value: 'like', label: 'Likes' },
  ];

  const handleTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];

    setSelectedTypes(newTypes);
    onFilterChange({ types: newTypes, sortBy });
  };

  const handleSortChange = (newSort: 'recent' | 'popular') => {
    setSortBy(newSort);
    onFilterChange({ types: selectedTypes, sortBy: newSort });
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Activity Types</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {activityTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type.value}
              checked={selectedTypes.includes(type.value)}
              onCheckedChange={() => handleTypeToggle(type.value)}
            >
              {type.label}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Sort By</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={sortBy === 'recent'}
            onCheckedChange={() => handleSortChange('recent')}
          >
            Most Recent
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={sortBy === 'popular'}
            onCheckedChange={() => handleSortChange('popular')}
          >
            Most Popular
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}