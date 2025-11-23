/**
 * AgentFilters - Search and Filter Controls
 * 
 * Provides search input, category filter, and sort options
 */

'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import type { AgentCategory, AgentFilters } from '@/types/agent';
import { CATEGORY_LABELS } from '@/types/agent';

interface AgentFiltersProps {
  filters: AgentFilters;
  onFiltersChange: (filters: AgentFilters) => void;
}

export function AgentFiltersBar({ filters, onFiltersChange }: AgentFiltersProps) {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      category: category === 'ALL' ? undefined : (category as AgentCategory),
    });
  };

  const handleSortChange = (sortBy: string) => {
    onFiltersChange({
      ...filters,
      sortBy: sortBy as AgentFilters['sortBy'],
    });
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    onFiltersChange({ ...filters, minPrice: val });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value ? Number(e.target.value) : undefined;
    onFiltersChange({ ...filters, maxPrice: val });
  };

  const clearFilters = () => {
    onFiltersChange({ sortBy: 'newest' });
  };

  const hasActiveFilters = filters.search || filters.category || filters.minPrice || filters.maxPrice;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search agents..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-lg border bg-background px-10 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <SlidersHorizontal className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Category Filter */}
        <div className="flex-1 min-w-[150px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Category
          </label>
          <select
            value={filters.category || 'ALL'}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="flex gap-2 min-w-[200px]">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Min Price
            </label>
            <input
              type="number"
              placeholder="0"
              min="0"
              value={filters.minPrice || ''}
              onChange={handleMinPriceChange}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Max Price
            </label>
            <input
              type="number"
              placeholder="Any"
              min="0"
              value={filters.maxPrice || ''}
              onChange={handleMaxPriceChange}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Sort By */}
        <div className="flex-1 min-w-[150px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Sort By
          </label>
          <select
            value={filters.sortBy || 'newest'}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="mb-[2px] px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

