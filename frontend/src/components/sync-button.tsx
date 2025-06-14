import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface SyncButtonProps {
  onSync: () => Promise<void>;
}

export function SyncButton({ onSync }: SyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSync = async () => {
    setLoading(true);
    setStatus('idle');
    
    try {
      await onSync();
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={loading}
      variant={status === 'error' ? 'destructive' : status === 'success' ? 'default' : 'outline'}
      size="sm"
    >
      {loading ? (
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      ) : status === 'success' ? (
        <CheckCircle className="mr-2 h-4 w-4" />
      ) : status === 'error' ? (
        <AlertCircle className="mr-2 h-4 w-4" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      
      {loading ? 'Sincronizando...' : 
       status === 'success' ? 'Sincronizado!' :
       status === 'error' ? 'Erro' : 'Sincronizar'}
    </Button>
  );
}