import React, { useState } from 'react';
import { listDocuments, downloadDocument } from '../services/documentService';

export default function ApplicantDocuments({ ownerType, ownerId }) {
  const [expanded, setExpanded] = useState(false);
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!expanded && documents === null) {
      setLoading(true);
      try {
        const docs = await listDocuments(ownerType, ownerId);
        setDocuments(docs);
      } catch {
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    }
    setExpanded((prev) => !prev);
  };

  return (
    <div className="applicant-documents">
      <button type="button" className="link-button" onClick={toggle}>
        {expanded ? 'Hide documents' : 'View documents'}
      </button>

      {expanded && (
        loading ? (
          <p className="hint-text">Loading…</p>
        ) : documents.length === 0 ? (
          <p className="hint-text">No documents uploaded.</p>
        ) : (
          <ul className="document-list">
            {documents.map((doc) => (
              <li key={doc.id}>
                <span>{doc.documentType.replace(/_/g, ' ')}</span>
                <span className="hint-text">{doc.originalFileName}</span>
                <button type="button" onClick={() => downloadDocument(doc.id, doc.originalFileName)}>
                  Download
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
