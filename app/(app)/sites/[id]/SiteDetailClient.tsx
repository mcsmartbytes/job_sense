"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MapView from "@/components/MapView";
import PrefHydrator from "@/components/PrefHydrator";
import { AIDetectionButton } from "@/components/AIDetectionButton";
import { AIReviewPanel } from "@/components/AIReviewPanel";
import { ObjectClassifier } from "@/components/ObjectClassifier";
import ObjectPanel from "@/components/panels/ObjectPanel";
import TradePanel from "@/components/panels/TradePanel";
import { useSiteStore } from "@/lib/site/store";
import type { SiteObject } from "@/lib/supabase/types";
import type { AIDetectedFeature } from "@/lib/ai/types";
import { trades, services } from "@/lib/seed/trades";

export default function SiteDetailClient({
  siteId,
  siteName,
  initialObjects,
}: {
  siteId: string;
  siteName: string;
  initialObjects: SiteObject[];
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const addObject = useSiteStore((s) => s.addObject);
  const openClassifier = useSiteStore((s) => s.openClassifier);
  const setObjects = useSiteStore((s) => s.setObjects);
  const objects = useSiteStore((s) => s.objects);
  const selectedObjectId = useSiteStore((s) => s.selectedObjectId);
  const site = useSiteStore((s) => s.site);
  const setSite = useSiteStore((s) => s.setSite);
  const setTrades = useSiteStore((s) => s.setTrades);
  const setServices = useSiteStore((s) => s.setServices);

  const [aiFeatures, setAIFeatures] = useState<AIDetectedFeature[]>([]);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [highlightedAIFeatureId, setHighlightedAIFeatureId] = useState<string | null>(null);
  const mapCaptureRef = useRef<(() => Promise<any | null>) | null>(null);
  const [blueprintOverlay, setBlueprintOverlay] = useState<any | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);

  const selectedObject = objects.find((obj) => obj.id === selectedObjectId);
  const selectedPolygon =
    selectedObject?.geometry?.type === "Polygon" ||
    selectedObject?.geometry?.type === "MultiPolygon"
      ? (selectedObject.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon)
      : null;

  useEffect(() => {
    setObjects(initialObjects);
  }, [initialObjects, setObjects]);

  useEffect(() => {
    setSite({ id: siteId, name: siteName } as any);
    setTrades(trades);
    setServices(services);
  }, [setSite, setTrades, setServices, siteId, siteName]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("blueprintOverlay");
      if (stored) {
        const overlayData = JSON.parse(stored);
        setBlueprintOverlay({ ...overlayData, opacity: overlayOpacity });
        sessionStorage.removeItem("blueprintOverlay");
      }
    } catch {}
  }, [overlayOpacity]);

  async function handleSave() {
    setStatus("saving");
    const features = objects.map((obj) => ({
      objectType: obj.object_type,
      geometry: obj.geometry,
      measurements: obj.measurements || {},
    }));

    const response = await fetch(`/api/sites/${siteId}/objects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features }),
    });

    setStatus(response.ok ? "saved" : "error");
    if (response.ok) {
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  const handleCaptureRequest = useCallback(async () => {
    if (!mapCaptureRef.current) return null;
    return await mapCaptureRef.current();
  }, []);

  const handleDetectionComplete = useCallback((features: AIDetectedFeature[]) => {
    setAIFeatures(features);
    if (features.length > 0) {
      setShowReviewPanel(true);
    }
  }, []);

  const handleApproveFeatures = useCallback(
    (features: AIDetectedFeature[]) => {
      for (const feature of features) {
        addObject({
          site_id: site?.id || siteId,
          object_type: feature.type,
          sub_type: feature.subType || null,
          tags: [],
          geometry: feature.geometry,
          properties: {},
          source: "ai-suggested",
          confidence: feature.confidence,
          label: feature.label || null,
          color: null,
        });
      }

      const approvedIds = new Set(features.map((f) => f.id));
      setAIFeatures((prev) => prev.filter((f) => !approvedIds.has(f.id)));
    },
    [addObject, site?.id, siteId]
  );

  const handleRejectFeatures = useCallback((featureIds: string[]) => {
    const rejectedIds = new Set(featureIds);
    setAIFeatures((prev) => prev.filter((f) => !rejectedIds.has(f.id)));
  }, []);

  return (
    <div className="site-layout">
      <PrefHydrator />
      <header className="site-header">
        <div className="site-header-left">
          <h1 className="site-title">{siteName}</h1>
          <p className="site-address">AI-powered measurements and job costing.</p>
        </div>
        <div className="site-header-right">
          <AIDetectionButton
            onCaptureRequest={handleCaptureRequest}
            onDetectionComplete={handleDetectionComplete}
            selectionPolygon={selectedPolygon}
            filterToSelection={!!selectedPolygon}
          />
          <button
            onClick={handleSave}
            className="btn btn-primary btn-sm"
            disabled={status === "saving"}
          >
            {status === "saving" ? "Saving..." : "Save Site"}
          </button>
        </div>
      </header>

      <div className="site-content">
        <aside className="site-panel site-panel-left">
          <ObjectPanel />
        </aside>

        <main className="site-map">
          <MapView
            onGeometryCreate={(geometry) => {
              openClassifier(geometry);
            }}
            aiFeatures={aiFeatures}
            highlightedAIFeatureId={highlightedAIFeatureId}
            captureRef={mapCaptureRef}
            blueprintOverlay={blueprintOverlay || undefined}
          />

          <div className="map-hint">
            Press <kbd>A</kbd> for polygon, <kbd>L</kbd> for line, <kbd>V</kbd> to select
          </div>

          {showReviewPanel && aiFeatures.length > 0 && (
            <AIReviewPanel
              features={aiFeatures}
              onApprove={handleApproveFeatures}
              onReject={handleRejectFeatures}
              onClose={() => setShowReviewPanel(false)}
              onHover={setHighlightedAIFeatureId}
            />
          )}

          {blueprintOverlay && (
            <div className="blueprint-overlay-controls">
              <div className="overlay-controls-header">
                <span className="overlay-controls-title">Blueprint Overlay</span>
                <button
                  onClick={handleClearOverlay}
                  className="overlay-close-btn"
                  title="Remove overlay"
                >
                  ×
                </button>
              </div>
              <div className="overlay-controls-body">
                <div className="overlay-info">
                  <span>Page {blueprintOverlay.pageNumber}</span>
                </div>
                <div className="overlay-opacity-control">
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={overlayOpacity * 100}
                    onChange={(event) => {
                      const value = Number(event.target.value) / 100;
                      setOverlayOpacity(value);
                      setBlueprintOverlay((prev: any) => (prev ? { ...prev, opacity: value } : prev));
                    }}
                  />
                  <span>{Math.round(overlayOpacity * 100)}%</span>
                </div>
                <p className="overlay-hint">
                  Move and resize the overlay to match the site, then trace features.
                </p>
              </div>
            </div>
          )}
        </main>

        <aside className="site-panel site-panel-right">
          <TradePanel />
        </aside>
      </div>

      {status === "saved" && (
        <div className="overlay" style={{ top: 80, right: 16 }}>
          <div className="glass metrics">Measurements saved.</div>
        </div>
      )}
      {status === "error" && (
        <div className="overlay" style={{ top: 80, right: 16 }}>
          <div className="glass metrics">Unable to save measurements. Try again.</div>
        </div>
      )}

      <ObjectClassifier />
    </div>
  );
}
  const handleClearOverlay = useCallback(() => {
    setBlueprintOverlay(null);
  }, []);
