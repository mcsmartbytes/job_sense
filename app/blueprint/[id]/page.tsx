'use client';

import { useEffect, useState, useCallback, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBlueprintStore } from '@/lib/blueprint/store';
import type { PDFDocument, PDFPage } from '@/lib/supabase/types';

interface PageWithUrls extends PDFPage {
  imageUrl: string | null;
  thumbnailUrl: string | null;
}

interface DocumentData {
  document: PDFDocument;
  pages: PageWithUrls[];
  pdfUrl?: string;
  imageUrl?: string;
}

// Page thumbnail card
function PageCard({
  page,
  pageNumber,
  onExportToMap,
}: {
  page: PageWithUrls;
  pageNumber: number;
  onExportToMap: () => void;
}) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      {/* Thumbnail area */}
      <div
        style={{
          aspectRatio: '8.5/11',
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {page.imageUrl ? (
          <img
            src={page.imageUrl}
            alt={`Page ${pageNumber}`}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <svg style={{ width: '32px', height: '32px', margin: '0 auto 8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p style={{ fontSize: '12px' }}>Page {pageNumber}</p>
          </div>
        )}

        {/* Page number badge */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          Page {pageNumber}
        </div>

        {/* Category badge if present */}
        {page.category && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: '#3b82f6',
              color: 'white',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
            }}
          >
            {page.category}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '12px', borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={onExportToMap}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Overlay on Map
        </button>
      </div>
    </div>
  );
}

export default function BlueprintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: documentId } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const router = useRouter();

  const setActiveDocument = useBlueprintStore((s) => s.setActiveDocument);
  const setPages = useBlueprintStore((s) => s.setPages);

  // Fetch document and pages
  useEffect(() => {
    async function fetchDocument() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/pdf/${documentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch document');
        }

        setDocumentData(data);
        setActiveDocument(documentId);

        if (data.pages) {
          setPages(data.pages);
        }
      } catch (err) {
        console.error('Failed to fetch document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocument();
  }, [documentId, setActiveDocument, setPages]);

  // Export page to map overlay
  const handleExportToMap = useCallback((page: PageWithUrls, pageNumber: number) => {
    if (!page.imageUrl) {
      alert('Page image not available');
      return;
    }

    // Store overlay data in sessionStorage
    const overlayData = {
      pageId: page.id,
      documentId: documentId,
      imageUrl: page.imageUrl,
      pageNumber: pageNumber,
      category: page.category,
    };
    sessionStorage.setItem('blueprintOverlay', JSON.stringify(overlayData));

    // Navigate to site page with overlay mode
    router.push('/site?mode=overlay');
  }, [documentId, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 16px',
              border: '4px solid #3b82f6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ color: '#4b5563' }}>Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <svg style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Failed to load document</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
          <Link
            href="/blueprint"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  const { document, pages } = documentData;

  return (
    <div style={{
      height: '100vh',
      background: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href="/blueprint"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>{document.name}</h1>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
                {pages.length} page{pages.length !== 1 ? 's' : ''} | Uploaded {new Date(document.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/site"
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Site Estimator
            </Link>
          </div>
        </div>
      </header>

      {/* Pages Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 500, color: '#111827', margin: 0 }}>
              Pages
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
              Click "Overlay on Map" to trace over a page in the site estimator
            </p>
          </div>

          {pages.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '48px', textAlign: 'center' }}>
              <p style={{ color: '#6b7280' }}>No pages found in this document</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {pages.map((page, index) => (
                <PageCard
                  key={page.id}
                  page={page}
                  pageNumber={index + 1}
                  onExportToMap={() => handleExportToMap(page, index + 1)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
