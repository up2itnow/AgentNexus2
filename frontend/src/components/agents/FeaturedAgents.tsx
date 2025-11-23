/**
 * Featured Agents Component
 * 
 * Displays a curated list of high-quality agents to promote discovery.
 * Currently uses a mock selection of agents.
 */

'use client';

import Link from 'next/link';
import { ArrowRight, Star, TrendingUp, ShieldCheck } from 'lucide-react';
import { Agent } from '@/types/agent';

// Mock featured agents for now
// In production, this would come from an API endpoint like /agents/featured
const FEATURED_AGENTS: Partial<Agent>[] = [
    {
        id: 'agent-zero',
        name: 'Agent Zero',
        description: 'The original autonomous agent framework. Capable of general-purpose task execution, coding, and research.',
        category: 'AUTOMATION',
        price: '0',
        imageUrl: '/agents/agent-zero.png',
        rating: 5.0,
        purchaseCount: 1250,
        creatorAddress: '0x123...abc',
    },
    {
        id: 'market-analyst-pro',
        name: 'Market Analyst Pro',
        description: 'Advanced crypto market analysis agent. Tracks sentiment, volume, and price action to identify trends.',
        category: 'TRADING',
        price: '50',
        imageUrl: '/agents/analyst.png',
        rating: 4.8,
        purchaseCount: 340,
        creatorAddress: '0x456...def',
    },
    {
        id: 'content-wizard',
        name: 'Content Wizard',
        description: 'SEO-optimized content generator. Creates blog posts, social media captions, and marketing copy.',
        category: 'CONTENT_CREATION',
        price: '25',
        imageUrl: '/agents/writer.png',
        rating: 4.9,
        purchaseCount: 890,
        creatorAddress: '0x789...ghi',
    },
];

export function FeaturedAgents() {
    return (
        <section className="py-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-2xl font-bold">Featured Agents</h2>
                </div>
                <Link
                    href="/marketplace?sort=popular"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                >
                    View All <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {FEATURED_AGENTS.map((agent) => (
                    <Link
                        key={agent.id}
                        href={agent.id === 'agent-zero' ? '/marketplace/agent-zero' : `/agents/${agent.id}`}
                        className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 transition-all overflow-hidden"
                    >
                        {/* Badge */}
                        <div className="absolute top-3 right-3 z-10 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            FEATURED
                        </div>

                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    {agent.name?.[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors line-clamp-1">
                                        {agent.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" />
                                        Verified Creator
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 h-10">
                                {agent.description}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span className="font-semibold">{agent.rating}</span>
                                    <span className="text-gray-400">({agent.purchaseCount})</span>
                                </div>
                                <div className="font-bold text-blue-600 dark:text-blue-400">
                                    {agent.price === '0' ? 'Free' : `$${agent.price}`}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
