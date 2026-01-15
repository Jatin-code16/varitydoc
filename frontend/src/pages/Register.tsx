import React, { useState } from 'react';
import { Upload, FileCheck } from 'lucide-react';
import { Card, CardContent, Button, Input, Textarea } from '@/components/ui';
import { documentAPI } from '@/api/client';

export const Register: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsSubmitting(true);
    try {
      const doc = await documentAPI.register(file, name, description);
      setResult(doc);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Card>
          <CardContent>
            <h2 style={{ color: 'var(--success-text)', marginBottom: 'var(--spacing-lg)' }}>✓ Document Registered</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div><strong>SHA-256:</strong> <code>{result.hash}</code></div>
              <div><strong>Uploaded by:</strong> {result.uploaded_by}</div>
            </div>
            <Button variant="primary" style={{ marginTop: 'var(--spacing-lg)' }} onClick={() => { setFile(null); setResult(null); setName(''); setDescription(''); }}>
              Register Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <FileCheck size={32} style={{ color: 'var(--primary-500)', marginBottom: 'var(--spacing-md)' }} />
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--spacing-sm)' }}>Register New Document</h1>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: 'var(--spacing-2xl)',
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('register-file-input')?.click()}
            >
              <Upload size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-md)' }} />
              <p>{file ? file.name : 'Click to select file'}</p>
              <input id="register-file-input" type="file" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>

            <Input label="Document Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Textarea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!file}>Register Document</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
