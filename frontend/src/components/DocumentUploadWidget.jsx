import React, { useEffect, useState } from 'react';
import { uploadDocument, listDocuments, downloadDocument } from '../services/documentService';

const TYPE_LABELS = {
  GOVERNMENT_REGISTRATION_CERTIFICATE: 'Government Registration Certificate',
  NCPA_DOCUMENT: 'NCPA Document',
  QUALIFICATION_CERTIFICATE: 'Qualification Certificate',
  POLICE_CLEARANCE_REPORT: 'Police Clearance Report',
  IDENTITY_DOCUMENT: 'Identity Document',
  ADDITIONAL_PROOF: 'Additional Proof Document'
};

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
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0])} />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload Document'}
        </button>
      </form>
    </div>
  );
}
