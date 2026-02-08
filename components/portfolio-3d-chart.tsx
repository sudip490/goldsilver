"use client";

import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Portfolio3DChartProps {
    data: {
        metal: 'gold' | 'silver';
        quantity: number;
        value: number;
    }[];
}

interface SliceProps {
    startAngle: number;
    endAngle: number;
    color: string;
    label: string;
    value: number;
    percentage: number;
    onHover: (hovered: boolean) => void;
}

function PieSlice({ startAngle, endAngle, color, label, value, percentage, onHover }: SliceProps) {
    const [hovered, setHovered] = useState(false);
    const [clicked, setClicked] = useState(false);

    // Create pie slice geometry
    const shape = new THREE.Shape();
    const radius = 2;
    const depth = 0.5;

    shape.moveTo(0, 0);
    shape.absarc(0, 0, radius, startAngle, endAngle, false);
    shape.lineTo(0, 0);

    const extrudeSettings = {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 3,
    };

    // Calculate center angle for label position
    const centerAngle = (startAngle + endAngle) / 2;
    const labelRadius = radius * 0.7;
    const labelX = Math.cos(centerAngle) * labelRadius;
    const labelY = Math.sin(centerAngle) * labelRadius;

    // Elevation when hovered or clicked
    const elevation = hovered || clicked ? 0.3 : 0;

    return (
        <group position={[0, 0, elevation]}>
            <mesh
                onPointerOver={() => {
                    setHovered(true);
                    onHover(true);
                }}
                onPointerOut={() => {
                    setHovered(false);
                    onHover(false);
                }}
                onClick={() => setClicked(!clicked)}
                castShadow
                receiveShadow
            >
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <meshStandardMaterial
                    color={color}
                    metalness={0.6}
                    roughness={0.3}
                    emissive={color}
                    emissiveIntensity={hovered ? 0.3 : 0.1}
                />
            </mesh>

            {/* Label */}
            {(hovered || clicked) && (
                <Text
                    position={[labelX, labelY, depth + 0.1]}
                    fontSize={0.25}
                    color="#FFFFFF"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    {`${label}\n${percentage.toFixed(1)}%\n$${value.toLocaleString()}`}
                </Text>
            )}
        </group>
    );
}

function Scene({ data }: Portfolio3DChartProps) {
    const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

    // Calculate total value
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);

    // Define colors for metals
    const colors = {
        gold: '#FFD700',
        silver: '#C0C0C0',
    };

    // Calculate angles for each slice
    let currentAngle = 0;
    const slices = data.map((item) => {
        const percentage = (item.value / totalValue) * 100;
        const angleSize = (item.value / totalValue) * Math.PI * 2;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angleSize;
        currentAngle = endAngle;

        return {
            ...item,
            startAngle,
            endAngle,
            percentage,
            color: colors[item.metal],
            label: item.metal.charAt(0).toUpperCase() + item.metal.slice(1),
        };
    });

    return (
        <>
            {/* Camera */}
            <PerspectiveCamera makeDefault position={[0, 0, 8]} />

            {/* Lights */}
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <spotLight
                position={[0, 10, 0]}
                angle={0.3}
                penumbra={1}
                intensity={1}
                castShadow
            />

            {/* Pie Slices */}
            {slices.map((slice, index) => (
                <PieSlice
                    key={index}
                    startAngle={slice.startAngle}
                    endAngle={slice.endAngle}
                    color={slice.color}
                    label={slice.label}
                    value={slice.value}
                    percentage={slice.percentage}
                    onHover={(hovered) => setHoveredSlice(hovered ? slice.label : null)}
                />
            ))}

            {/* Controls */}
            <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={5}
                maxDistance={15}
                autoRotate={!hoveredSlice}
                autoRotateSpeed={2}
            />
        </>
    );
}

export function Portfolio3DChart({ data }: Portfolio3DChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[400px] bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">No portfolio data available</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden bg-gradient-to-br from-background to-muted/20 relative">
            <Canvas shadows>
                <Suspense fallback={null}>
                    <Scene data={data} />
                </Suspense>
            </Canvas>

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full inline-block">
                    🖱️ Drag to rotate • 🔍 Scroll to zoom • 👆 Click slices for details
                </p>
            </div>
        </div>
    );
}
