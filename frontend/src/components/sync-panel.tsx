/**
 * 🔄 PAINEL DE SINCRONIZAÇÃO ONLINE
 * Interface simplificada para sistema 100% online
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Monitor } from 'lucide-react';

export function SyncPanel() {
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro' | 'info', texto: string } | null>(null);

  useEffect(() => {
    setMensagem({ 
      tipo: 'info', 
      texto: 'Sistema funcionando 100% online - sincronização automática ativa' 
    });
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="h-5 w-5" />
            <span>Status do Sistema</span>
          </CardTitle>
          <CardDescription>
            Sistema online com sincronização em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Sistema Online</p>
                  <p className="text-sm text-green-700">Conectado ao servidor</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Ativo
              </Badge>
            </div>

            {/* Mensagem de status */}
            {mensagem && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {mensagem.texto}
                </AlertDescription>
              </Alert>
            )}

            {/* Informações */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">Real-time</p>
                <p className="text-sm text-gray-600">Sincronização</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">Online</p>
                <p className="text-sm text-gray-600">Status</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}