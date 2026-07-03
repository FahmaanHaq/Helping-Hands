import React, { useEffect, useState } from 'react';
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

/**
 * ownerType: 'CHILDRENS_HOME' | 'SERVICE_PROVIDER'
 * ownerId: numeric id of the profile the documents belong to
 * allowedTypes: array of DocumentType strings this owner is allowed to upload
 */
export default function DocumentUploadWidget({ ownerType, ownerId, allowedTypes }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentType, setDocumentType] = useState(allowedTypes[0]);
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = () => {
    setLoading(true);
    listDocuments(ownerType, ownerId)
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [ownerType, ownerId]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    // Same rule the backend enforces — catching it here saves a wasted
    // round trip, especially over a slow connection.
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError(`"${selected.name}" is ${(selected.size / (1024 * 1024)).toFixed(1)}MB — the limit is 10MB.`);
      setFile(null);
      e.target.value = '';
      return;
    }
    if (!ALLOWED_CONTENT_TYPES.includes(selected.type)) {
      setError('Only PDF, JPG, and PNG files are accepted.');
      setFile(null);
      e.target.value = '';
      return;
    }
    setFile(selected);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Choose a file first');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await uploadDocument({ ownerType, ownerId, documentType, remarks, file });
      setFile(null);
      setRemarks('');
      e.target.reset();
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-widget">
      <h3>Documents</h3>

      {loading ? (
        <p className="hint-text">Loading documents…</p>
      ) : documents.length === 0 ? (
        <p className="hint-text">No documents uploaded yet.</p>
      ) : (
        <ul className="document-list">
          {documents.map((doc) => (
            <li key={doc.id}>
              <span>{TYPE_LABELS[doc.documentType] || doc.documentType}</span>
              <span className="hint-text">{doc.originalFileName} · {(doc.fileSizeBytes / 1024).toFixed(0)} KB</span>
              <button type="button" onClick={() => downloadDocument(doc.id, doc.originalFileName)}>
                Download
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleUpload} className="document-upload-form">
        <label>
          Document Type
          <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
            {allowedTypes.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
            ))}
          </select>
        </label>
        <label>
          Remarks (optional)
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </label>
        <label>
          File (PDF, JPG, or PNG — max 10MB)
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload Document'}
        </button>
      </form>
    </div>
  );
}
