/**
 * Template Builder - Template Selection Page
 * 
 * Displays a grid of available templates for beginners to choose from
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { useTemplates } from '@/hooks/useBuilder';
import type { AgentTemplate, TemplateDifficulty } from '@/types/builder';
import { AgentCategory } from '@/types/agent';

export default function TemplateGridPage() {
  const { templates, isLoading, isError } = useTemplates();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<TemplateDifficulty | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<AgentCategory | 'ALL'>('ALL');

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Difficulty filter
      if (difficultyFilter !== 'ALL' && template.difficulty !== difficultyFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && template.category !== categoryFilter) {
        return false;
      }

      return template.isActive;
    });
  }, [templates, searchQuery, difficultyFilter, categoryFilter]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Methods
          </Link>
          <h1 className="text-4xl font-bold mb-2">Select a Template</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose from {templates.length} pre-built agent templates
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as TemplateDifficulty | 'ALL')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Difficulties</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as AgentCategory | 'ALL')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">General</option>
              <option value="CRYPTO">Crypto</option>
              <option value="TRADING">Trading</option>
              <option value="SOCIAL">Social</option>
              <option value="DEFI">DeFi</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading templates...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">Failed to load templates</p>
            <p className="text-sm text-red-500 dark:text-red-300">Please try again later</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredTemplates.length === 0 && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-12 text-center">
            <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No templates found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Try adjusting your filters or search query
            </p>
          </div>
        )}

        {/* Template Grid */}
        {!isLoading && !isError && filteredTemplates.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TEMPLATE CARD COMPONENT
// ============================================================================

interface TemplateCardProps {
  template: AgentTemplate;
}

function TemplateCard({ template }: TemplateCardProps) {
  const difficultyColors = {
    BEGINNER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    ADVANCED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    EXPERT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  };

  const complexityStars = '⭐'.repeat(template.complexity);

  return (
    <Link href={`/builder/template/${template.id}`}>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all hover:border-blue-400 dark:hover:border-blue-600 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">
              {template.name}
            </h3>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${difficultyColors[template.difficulty]}`}>
                {template.difficulty}
              </span>
              {template.featured && (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  ⭐ Featured
                </span>
              )}
            </div>
          </div>
          <div className="text-2xl">{template.icon || '🤖'}</div>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-grow line-clamp-3">
          {template.description}
        </p>

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-500">Complexity</span>
            <span className="font-medium">{complexityStars}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-500">Category</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{template.category}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-500">Times Used</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{template.usageCount}</span>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${template.basePrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">Base price</div>
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors">
            Select →
          </button>
        </div>
      </div>
    </Link>
  );
}

