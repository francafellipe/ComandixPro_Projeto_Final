import { Mail, Phone } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="bg-gray-900 text-white py-6 mt-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center space-y-3">
          <div>
            <h3 className="text-xl font-bold text-blue-400">ComandixPro</h3>
            <p className="text-sm text-gray-300">Sistema de Gestão para Bares e Restaurantes</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Desenvolvido por: Fellipe Anderson França e Lima</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a 
                href="mailto:fellipeandersomdev@gmail.com"
                className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors"
              >
                <Mail className="h-4 w-4" />
                fellipeandersomdev@gmail.com
              </a>
              
              <a 
                href="tel:+5585996567522"
                className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors"
              >
                <Phone className="h-4 w-4" />
                (85) 99656-7522
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-3 mt-4">
            <p className="text-xs text-gray-400">
              © 2025 ComandixPro - Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}