import { Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CacheIndicatorProps {
  isLoading?: boolean;
  dataSource?: 'servidor' | 'loading';
}

export function CacheIndicator({ isLoading = false, dataSource }: CacheIndicatorProps) {
  if (isLoading) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Wifi className="w-3 h-3 mr-1 animate-pulse" />
        Carregando...
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs">
      <Wifi className="w-3 h-3 mr-1 text-green-600" />
      Online
    </Badge>
  );
}