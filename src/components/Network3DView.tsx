import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { NetworkTopology, NetworkDevice } from '../types';

interface Network3DViewProps {
  topology: NetworkTopology;
  selectedDeviceId: string | null;
  onSelectDevice: (device: NetworkDevice) => void;
}

export const Network3DView: React.FC<Network3DViewProps> = ({
  topology,
  selectedDeviceId,
  onSelectDevice
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 500;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712); // slate-950

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(160, 20, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // Ambient and Point Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    // Map 2D coords to 3D space
    const deviceObjects: Map<string, THREE.Mesh> = new Map();
    const nodeGeometry = new THREE.SphereGeometry(3.5, 32, 32);
    const serverGeometry = new THREE.BoxGeometry(5, 7, 5);
    const routerGeometry = new THREE.CylinderGeometry(4, 4, 3, 24);

    const getDeviceColor = (type: string) => {
      switch (type.toLowerCase()) {
        case 'router': return 0xf59e0b; // amber
        case 'switch': return 0x10b981; // emerald
        case 'server': return 0x6366f1; // indigo
        case 'firewall': return 0xef4444; // red
        case 'internet': return 0x06b6d4; // cyan
        default: return 0x38bdf8; // sky
      }
    };

    topology.devices.forEach((dev, idx) => {
      const x3d = (dev.x - 400) * 0.18;
      const z3d = (dev.y - 250) * 0.18;

      let geom: THREE.BufferGeometry = nodeGeometry;
      if (dev.type === 'server') geom = serverGeometry;
      if (dev.type === 'router') geom = routerGeometry;

      const isSelected = dev.id === selectedDeviceId;
      const material = new THREE.MeshStandardMaterial({
        color: getDeviceColor(dev.type),
        emissive: isSelected ? 0x38bdf8 : 0x051d38,
        emissiveIntensity: isSelected ? 0.8 : 0.2,
        roughness: 0.3,
        metalness: 0.8
      });

      const mesh = new THREE.Mesh(geom, material);
      mesh.position.set(x3d, 0, z3d);
      mesh.userData = { device: dev };
      scene.add(mesh);
      deviceObjects.set(dev.id, mesh);

      // Glowing selection ring if selected
      if (isSelected) {
        const ringGeom = new THREE.RingGeometry(5, 5.8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -2;
        mesh.add(ring);
      }
    });

    // Draw 3D Connection Lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x334155, linewidth: 2 });
    topology.connections.forEach(conn => {
      const srcMesh = deviceObjects.get(conn.sourceDeviceId);
      const tgtMesh = deviceObjects.get(conn.targetDeviceId);
      if (srcMesh && tgtMesh) {
        const points = [srcMesh.position, tgtMesh.position];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeom, lineMaterial);
        scene.add(line);
      }
    });

    // Simple orbiting animation
    let animationFrameId: number;
    let angle = 0;
    const animate = () => {
      angle += 0.003;
      camera.position.x = Math.sin(angle) * 110;
      camera.position.z = Math.cos(angle) * 110;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [topology, selectedDeviceId]);

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-cyan-300">
        Three.js 3D Interactive Topology Orbit Mode
      </div>
    </div>
  );
};
