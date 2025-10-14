/**
 * Agent Builder - Landing Page
 * 
 * Allows users to choose their preferred agent building method:
 * 1. Beginner (Template) - Pre-configured templates
 * 2. Hybrid (Modular) - Drag-and-drop modules
 * 3. Advanced (Custom Code) - Full code editor
 */

'use client';

import Link from 'next/link';
import { ArrowRight, Code, Layers, Layout } from 'lucide-react';

export default function BuilderLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🤖 Build Your Own AI Agent
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose your creation method based on your skill level and requirements
          </p>
        </div>

        {/* Method Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {/* Beginner: Template */}
          <MethodCard
            icon={<Layout className="w-12 h-12" />}
            title="Beginner"
            subtitle="Template Builder"
            difficulty="EASY"
            time="~5 minutes"
            description="Select from pre-built templates and configure simple settings"
            color="green"
            features={[
              'Pre-configured templates',
              'Simple form-based config',
              'Quick deployment',
              'Perfect for first-time users',
            ]}
            href="/builder/template"
            badge="🟢"
          />

          {/* Hybrid: Modular */}
          <MethodCard
            icon={<Layers className="w-12 h-12" />}
            title="Hybrid"
            subtitle="Modular Builder"
            difficulty="MODERATE"
            time="~10 minutes"
            description="Drag and drop modules to build custom workflows"
            color="yellow"
            features={[
              'Visual drag-and-drop',
              'Combine modules',
              'Flexible workflows',
              'Great for customization',
            ]}
            href="/builder/modular"
            badge="🟡"
          />

          {/* Advanced: Custom Code */}
          <MethodCard
            icon={<Code className="w-12 h-12" />}
            title="Advanced"
            subtitle="Code Editor"
            difficulty="EXPERT"
            time="~20 minutes"
            description="Full code editor with maximum flexibility"
            color="red"
            features={[
              'Full TypeScript/JavaScript',
              'Complete control',
              'Advanced features',
              'For experienced developers',
            ]}
            href="/builder/advanced"
            badge="🔴"
          />
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center gap-8 mb-12">
          <StatBadge label="Templates" value="5" />
          <StatBadge label="Modules" value="13" />
          <StatBadge label="Created Agents" value="247" />
        </div>

        {/* My Agents Link */}
        <div className="text-center">
          <Link
            href="/builder/my-agents"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            📊 View My Custom Agents
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface MethodCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  difficulty: string;
  time: string;
  description: string;
  color: 'green' | 'yellow' | 'red';
  features: string[];
  href: string;
  badge: string;
}

function MethodCard({
  icon,
  title,
  subtitle,
  difficulty,
  time,
  description,
  color,
  features,
  href,
  badge,
}: MethodCardProps) {
  const colorClasses = {
    green: {
      bg: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      border: 'border-green-200 hover:border-green-400 dark:border-green-700 dark:hover:border-green-500',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      icon: 'text-green-600 dark:text-green-400',
      button: 'bg-green-600 hover:bg-green-700 text-white',
    },
    yellow: {
      bg: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
      border: 'border-yellow-200 hover:border-yellow-400 dark:border-yellow-700 dark:hover:border-yellow-500',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      icon: 'text-yellow-600 dark:text-yellow-400',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    red: {
      bg: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
      border: 'border-red-200 hover:border-red-400 dark:border-red-700 dark:hover:border-red-500',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
      icon: 'text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
  };

  const classes = colorClasses[color];

  return (
    <div
      className={`relative rounded-xl border-2 ${classes.border} bg-gradient-to-br ${classes.bg} p-6 transition-all hover:shadow-lg flex flex-col h-full`}
    >
      {/* Badge */}
      <div className="absolute top-4 right-4 text-3xl">{badge}</div>

      {/* Icon */}
      <div className={`mb-4 ${classes.icon}`}>{icon}</div>

      {/* Title */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-1">{title}</h2>
        <p className="text-gray-600 dark:text-gray-300">{subtitle}</p>
      </div>

      {/* Difficulty & Time */}
      <div className="flex gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classes.badge}`}>
          {difficulty}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {time}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-700 dark:text-gray-300 mb-6 flex-grow">{description}</p>

      {/* Features */}
      <ul className="space-y-2 mb-6">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Link
        href={href}
        className={`${classes.button} px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors mt-auto`}
      >
        Start Building
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

interface StatBadgeProps {
  label: string;
  value: string;
}

function StatBadge({ label, value }: StatBadgeProps) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}

