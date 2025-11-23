'use client';

import React from 'react';
import SwarmComposer from '@/components/swarm/SwarmComposer';
import { Navbar } from '@/components/layout/Navbar';

export default function SwarmPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Swarm Composer
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Drag and drop agents to create autonomous workflows. Connect outputs to inputs to build powerful swarms.
                    </p>
                </div>

                <SwarmComposer />
            </main>
        </div>
    );
}
