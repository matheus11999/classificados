import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 text-center">
          {/* Logo */}
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-tag text-white text-3xl"></i>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Classificados Regionais
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Encontre produtos e serviços na sua região. Compre, venda e conecte-se com pessoas próximas a você.
          </p>

          <div className="space-y-4">
            <Button
              onClick={handleLogin}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
              data-testid="button-login"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Entrar / Cadastrar
            </Button>

            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <i className="fas fa-shield-alt text-emerald-600 mr-2"></i>
                Seguro
              </div>
              <div className="flex items-center">
                <i className="fas fa-users text-emerald-600 mr-2"></i>
                Comunidade
              </div>
              <div className="flex items-center">
                <i className="fas fa-mobile-alt text-emerald-600 mr-2"></i>
                Mobile
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Como funciona:
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  1
                </span>
                Cadastre-se gratuitamente
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  2
                </span>
                Publique seus anúncios
              </div>
              <div className="flex items-center">
                <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  3
                </span>
                Conecte-se via WhatsApp
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
