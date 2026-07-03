import React, { useEffect, useRef, useState } from 'react';
import { Upload, RefreshCw, Check } from 'lucide-react';
import { uploadDocument, listDocuments, downloadDocument } from '../services/documentService';

const TYPE_LABELS = {
  GOVERNMENT_REGISTRATION_CERTIFICATE: 'Government Registration Certificate',
  NCPA_DOCUMENT: 'NCPA Document',
  QUALIFICATION_CERTIFICATE: 'Qualification Certificate',
  POLICE_CLEARANCE_REPORT: 'Police Clearance Report',
  IDENTITY_DOCUMENT: 'Identity Document',
  ADDITIONAL_PROOF: 'Additional Proof Document',
  REQUEST_IMAGE: 'Request Image'
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

function validateClientSide(file) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB — the limit is 10MB.`;
  }
  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
    return `"${file.name}" isn't a PDF, JPG, or PNG.`;
  }
  return null;
}

/**
 * One row per document type — each type can hold exactly one active
 * document (uploading a new one replaces the old, enforced server-side
 * too), so "upload" and "replace" are the same action from here.
 */
function DocumentTypeRow({ type, existingDoc, ownerType, ownerId, onChanged }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFileChosen = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file name later
    if (!file) return;

    const clientError = validateClientSide(file);
    if (clientError) {
      setError(clientError);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await uploadDocument({ ownerType, ownerId, documentType: type, remarks: '', file });
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="doc-type-row">
      <div className="doc-type-row-main">
        <span className="doc-type-row-label">{TYPE_LABELS[type] || type}</span>
        {existingDoc ? (
          <span className="doc-type-row-status doc-type-row-status-done">
            <Check size={13} /> {existingDoc.originalFileName} · {(existingDoc.fileSizeBytes / 1024).toFixed(0)} KB
          </span>
        ) : (
          <span className="doc-type-row-status">Not uploaded yet</span>
        )}
      </div>
      <div className="doc-type-row-actions">
        {existingDoc && (
          <button type="button" onClick={() => downloadDocument(existingDoc.id, existingDoc.originalFileName)}>
            Download
          </button>
        )}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : existingDoc ? <><RefreshCw size={14} /> Replace</> : <><Upload size={14} /> Upload</>}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChosen}
          style={{ display: 'none' }}
        />
      </div>
      {error && <p className="field-error-text">{error}</p>}
    </div>
  );
}

/**
 * Multi-file picker for request images — the one deliberate exception to
 * "one document per type": a Home naturally wants several photos per
 * request, so these accumulate rather than replace.
 */
function RequestImageUploader({ ownerId, onChanged }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  const handleFilesChosen = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (files.length === 0) return;

    const clientErrors = files.map(validateClientSide).filter(Boolean);
    if (clientErrors.length > 0) {
      setError(clientErrors.join(' '));
      return;
    }

    setUploading(true);
    setError(null);
    let uploadedCount = 0;
    for (const file of files) {
      setProgress(`Uploading ${uploadedCount + 1} of ${files.length}…`);
      try {
        await uploadDocument({ ownerType: 'REQUEST', ownerId, documentType: 'REQUEST_IMAGE', remarks: '', file });
        uploadedCount++;
      } catch (err) {
        setError(`"${file.name}" failed: ${err.response?.data?.message || 'upload error'}`);
        break;
      }
    }
    setProgress(null);
    setUploading(false);
    if (uploadedCount > 0) onChanged();
  };

  return (
    <div className="doc-type-row">
      <div className="doc-type-row-main">
        <span className="doc-type-row-label">Add Photos</span>
        <span className="doc-type-row-status">Select one or more images — each is added, not replaced</span>
      </div>
      <div className="doc-type-row-actions">
        <label className="btn-file-select">
          <Upload size={14} /> {uploading ? (progress || 'Uploading…') : 'Choose Files'}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            onChange={handleFilesChosen}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      {error && <p className="field-error-text">{error}</p>}
    </div>
  );
}

/**
 * ownerType: 'CHILDRENS_HOME' | 'SERVICE_PROVIDER' | 'REQUEST'
 * ownerId: numeric id of the profile/request the documents belong to
 * allowedTypes: array of DocumentType strings this owner is allowed to upload
 */
export default function DocumentUploadWidget({ ownerType, ownerId, allowedTypes }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const isRequestImages = ownerType === 'REQUEST';

  const refresh = () => {
    setLoading(true);
    listDocuments(ownerType, ownerId)
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [ownerType, ownerId]);

  return (
    <div className="document-widget">
      <h3>Documents</h3>

      {loading ? (
        <p className="hint-text">Loading documents…</p>
      ) : isRequestImages ? (
        documents.length === 0 ? (
          <p className="hint-text">No images uploaded yet.</p>
        ) : (
          <ul className="document-list">
            {documents.map((doc) => (
              <li key={doc.id}>
                <span>{doc.originalFileName}</span>
                <span className="hint-text">{(doc.fileSizeBytes / 1024).toFixed(0)} KB</span>
                <button type="button" onClick={() => downloadDocument(doc.id, doc.originalFileName)}>Download</button>
              </li>
            ))}
          </ul>
        )
      ) : null}

      <div className="doc-type-row-list">
        {isRequestImages ? (
          <RequestImageUploader ownerId={ownerId} onChanged={refresh} />
        ) : (
          allowedTypes.map((type) => (
            <DocumentTypeRow
              key={type}
              type={type}
              existingDoc={documents.find((d) => d.documentType === type)}
              ownerType={ownerType}
              ownerId={ownerId}
              onChanged={refresh}
            />
          ))
        )}
      </div>
    </div>
  );
}
