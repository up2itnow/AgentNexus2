import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface Node {
    id: string;
    type: string;
    label: string;
    x: number;
    y: number;
    color: string;
}

interface Connection {
    from: string;
    to: string;
}

const agentTypes = [
    { id: 'marketing', label: 'Marketing Agent', color: '#ec4899' },
    { id: 'discovery', label: 'First-Mover Agent', color: '#8b5cf6' },
    { id: 'sentinel', label: 'DeFi Sentinel', color: '#10b981' },
    { id: 'privacy', label: 'Privacy Guardian', color: '#3b82f6' },
];

const SwarmComposer = () => {
    const [nodes, setNodes] = useState<Node[]>([
        { id: 'start', type: 'trigger', label: 'Start Trigger', x: 50, y: 300, color: '#64748b' }
    ]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [swarmName, setSwarmName] = useState('My New Swarm');
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [connectingNode, setConnectingNode] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const canvasRef = useRef<HTMLDivElement>(null);

    const addNode = (type: typeof agentTypes[0]) => {
        const newNode: Node = {
            id: `${type.id}-${Date.now()}`,
            type: type.id,
            label: type.label,
            x: 200 + Math.random() * 100,
            y: 200 + Math.random() * 100,
            color: type.color
        };
        setNodes([...nodes, newNode]);
    };

    const removeNode = (id: string) => {
        if (id === 'start') return;
        setNodes(nodes.filter(n => n.id !== id));
        setConnections(connections.filter(c => c.from !== id && c.to !== id));
    };

    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (e.button === 0) { // Left click to drag
            setDraggingNode(id);
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y });

        if (draggingNode) {
            setNodes(nodes.map(n => {
                if (n.id === draggingNode) {
                    return { ...n, x: x - 75, y: y - 25 }; // Center offset
                }
                return n;
            }));
        }
    };

    const handleCanvasMouseUp = () => {
        setDraggingNode(null);
        setConnectingNode(null);
    };

    const startConnection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setConnectingNode(id);
    };

    const completeConnection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (connectingNode && connectingNode !== id) {
            // Check if connection already exists
            if (!connections.find(c => c.from === connectingNode && c.to === id)) {
                setConnections([...connections, { from: connectingNode, to: id }]);
            }
        }
        setConnectingNode(null);
    };

    const handleDeploy = () => {
        if (nodes.length < 2) {
            toast.error("Swarm must have at least one agent connected.");
            return;
        }
        // console.log("Deploying Swarm:", { name: swarmName, nodes, connections });
        toast.success(`Swarm "${swarmName}" deployed successfully!`);
    };

    return (
        <div className="flex h-[80vh] w-full border border-gray-700 rounded-lg overflow-hidden bg-slate-900">
            {/* Sidebar */}
            <div className="w-64 bg-slate-800 p-4 border-r border-gray-700 flex flex-col gap-4 z-10">
                <h2 className="text-xl font-bold text-white mb-4">Swarm Builder</h2>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-400">Swarm Name</label>
                    <input
                        type="text"
                        value={swarmName}
                        onChange={(e) => setSwarmName(e.target.value)}
                        className="bg-slate-700 border border-gray-600 rounded p-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-2 mt-4">
                    <label className="text-sm text-gray-400">Available Agents</label>
                    {agentTypes.map((agent) => (
                        <div
                            key={agent.id}
                            className="p-3 rounded cursor-pointer hover:opacity-80 transition-opacity text-sm font-medium text-white shadow-sm flex items-center justify-between"
                            style={{ backgroundColor: agent.color }}
                            onClick={() => addNode(agent)}
                        >
                            {agent.label}
                            <span className="text-xs opacity-70">+</span>
                        </div>
                    ))}
                </div>

                <div className="mt-auto">
                    <Button
                        onClick={handleDeploy}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 px-4 rounded shadow-lg transform transition hover:scale-105"
                    >
                        Deploy Swarm 🚀
                    </Button>
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="flex-1 h-full relative overflow-hidden cursor-crosshair"
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
            >
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                />

                {/* Connections (SVG Layer) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {connections.map((conn, i) => {
                        const fromNode = nodes.find(n => n.id === conn.from);
                        const toNode = nodes.find(n => n.id === conn.to);
                        if (!fromNode || !toNode) return null;

                        return (
                            <line
                                key={i}
                                x1={fromNode.x + 150} y1={fromNode.y + 25} // Right side of from
                                x2={toNode.x} y2={toNode.y + 25} // Left side of to
                                stroke="#64748b"
                                strokeWidth="2"
                                markerEnd="url(#arrowhead)"
                            />
                        );
                    })}
                    {connectingNode && (
                        <line
                            x1={nodes.find(n => n.id === connectingNode)!.x + 150}
                            y1={nodes.find(n => n.id === connectingNode)!.y + 25}
                            x2={mousePos.x}
                            y2={mousePos.y}
                            stroke="#64748b"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                        />
                    )}
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                    </defs>
                </svg>

                {/* Nodes */}
                {nodes.map((node) => (
                    <div
                        key={node.id}
                        className="absolute p-3 rounded shadow-lg flex items-center justify-between group"
                        style={{
                            left: node.x,
                            top: node.y,
                            backgroundColor: '#0f172a',
                            border: `1px solid ${node.color}`,
                            width: '150px',
                            height: '50px',
                            cursor: 'move'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, node.id)}
                    >
                        {/* Input Port */}
                        {node.id !== 'start' && (
                            <div
                                className="w-3 h-3 rounded-full bg-gray-400 absolute -left-1.5 hover:bg-white cursor-pointer"
                                onMouseUp={(e) => completeConnection(e, node.id)}
                            />
                        )}

                        <span className="text-xs font-medium text-white truncate px-2 select-none pointer-events-none">
                            {node.label}
                        </span>

                        {/* Delete Button */}
                        {node.id !== 'start' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        )}

                        {/* Output Port */}
                        <div
                            className="w-3 h-3 rounded-full bg-blue-500 absolute -right-1.5 hover:bg-blue-400 cursor-pointer"
                            onMouseDown={(e) => startConnection(e, node.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SwarmComposer;
