import { useEffect } from "react";
import { useLocation } from "wouter";
import { userAuth } from "@/lib/user-auth";
import UserDashboard from "./UserDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, ShoppingCart, Users, Globe } from "lucide-react";

export default function Profile() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (userAuth.isAuthenticated()) {
      // User is authenticated, show dashboard
      return;
    }
  }, []);

  // If user is authenticated, show dashboard
  if (userAuth.isAuthenticated()) {
    return <UserDashboard />;
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Info className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Informações do Marketplace</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Tudo que você precisa saber sobre como usar nossa plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-700 dark:text-emerald-400">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Sobre o Marketplace
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Compre e Venda</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Plataforma gratuita para comprar e vender produtos usados com facilidade
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Comunidade Local</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Conecte-se com pessoas da sua região e fortaleça a economia local
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Sustentabilidade</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Promova a reutilização e contribua para uma economia mais circular
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700 dark:text-blue-400">
              <Info className="h-5 w-5 mr-2" />
              Como Funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  🔍 Navegue pelos produtos
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Explore categorias e encontre exatamente o que procura
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  📝 Crie seus anúncios
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Publique seus produtos com fotos e descrição detalhada
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  💬 Conecte-se via WhatsApp
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Negocie diretamente com compradores/vendedores
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-red-700 dark:text-red-400">
            🛡️ Dicas de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🤝</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Encontros seguros
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Sempre encontre em locais públicos e movimentados para sua segurança
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">💰</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Pagamento na entrega
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Evite pagamentos antecipados ou transferências antes de ver o produto
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📱</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Teste antes de comprar
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Verifique o funcionamento e condições antes de finalizar a compra
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🚨</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Confie no seu instinto
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Se algo parecer suspeito ou estranho, cancele a negociação imediatamente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
