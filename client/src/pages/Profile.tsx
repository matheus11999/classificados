import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, ShoppingCart, Users, Globe } from "lucide-react";

export default function Profile() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Informações</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Sobre o Marketplace
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Compre e Venda</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Plataforma gratuita para comprar e vender produtos usados
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Comunidade Local</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Conecte-se com pessoas da sua região
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Globe className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Sustentabilidade</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Promova a reutilização e economia circular
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                1. 🔍 Navegue pelos produtos
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Explore categorias e encontre o que procura
              </p>
            </div>
            <div className="text-sm">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                2. 📝 Crie seus anúncios
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Publique seus produtos com fotos e descrição
              </p>
            </div>
            <div className="text-sm">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                3. 💬 Conecte-se via WhatsApp
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Negocie diretamente com compradores/vendedores
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dicas de Segurança</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-sm">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              🤝 Encontros seguros
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              Sempre encontre em locais públicos e movimentados
            </p>
          </div>
          <div className="text-sm">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              💰 Pagamento na entrega
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              Evite pagamentos antecipados ou transferências
            </p>
          </div>
          <div className="text-sm">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              📱 Teste antes de comprar
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              Verifique o funcionamento antes de finalizar
            </p>
          </div>
          <div className="text-sm">
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              🚨 Confie no seu instinto
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              Se algo parecer suspeito, cancele a negociação
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
