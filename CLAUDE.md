# PWA Marketplace - Documentação Técnica

## Visão Geral
Este é um aplicativo PWA (Progressive Web App) de marketplace construído com Node.js, Express, React e PostgreSQL. O aplicativo funciona completamente sem autenticação, permitindo que qualquer pessoa visualize produtos, crie anúncios e faça negociações via WhatsApp.

## Tecnologias Utilizadas
- **Backend**: Node.js + Express
- **Frontend**: React + TypeScript
- **Banco de Dados**: PostgreSQL
- **ORM**: Drizzle ORM
- **UI**: Radix UI + Tailwind CSS
- **Build**: Vite + esbuild

## Estrutura do Projeto
```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilitários
├── server/                # Backend Express
│   ├── db.ts             # Configuração do banco de dados
│   ├── routes.ts         # Rotas da API
│   ├── storage.ts        # Camada de acesso aos dados
│   └── index.ts          # Servidor principal
├── shared/               # Tipos e schemas compartilhados
└── migrations/           # Migrações do banco de dados
```

## Configuração do Ambiente

### Variáveis de Ambiente (.env)
```bash
# Banco de dados PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Chave secreta da sessão
SESSION_SECRET=your_super_secret_session_key_here

# Ambiente
NODE_ENV=production
PORT=5000

# MercadoPago Integration (para pagamentos PIX)
MERCADOPAGO_ACCESS_TOKEN=your_mercadopago_access_token_here

# URL base da aplicação (para webhooks do MercadoPago)
BASE_URL=http://localhost:5000
```

### Comandos Disponíveis
- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Constrói para produção
- `npm start` - Executa em produção
- `npm run check` - Verificação de tipos TypeScript
- `npm run db:push` - Aplica mudanças no esquema do banco

## Deploy no EasyPanel

### Usando Docker
1. Configure as variáveis de ambiente no painel
2. Use o Dockerfile fornecido
3. Configure o banco PostgreSQL
4. Execute `docker-compose up -d`

### Variáveis de Ambiente Necessárias
- `DATABASE_URL` - URL de conexão PostgreSQL
- `SESSION_SECRET` - Chave para sessões
- `NODE_ENV=production`
- `PORT=5000`
- `MERCADOPAGO_ACCESS_TOKEN` - Token de acesso do Mercado Pago para PIX
- `BASE_URL` - URL base da aplicação (para webhooks)

## Banco de Dados

### Esquema Principal
- **users** - Usuários do sistema
- **categories** - Categorias de produtos
- **ads** - Anúncios/produtos
- **favorites** - Favoritos dos usuários
- **sessions** - Sessões de usuário
- **boost_promotions** - Promoções de impulsionamento (preços e configurações)
- **boosted_ads** - Anúncios impulsionados com dados de pagamento PIX

### Migrações
Execute `npm run db:push` para aplicar o esquema no banco.

## Funcionalidades

### ✅ Funcionalidades Ativas (100% Funcionais)
- **Visualizar Produtos** - Browse completo de anúncios
- **Criar Anúncios** - Publicação livre sem registro
- **Busca e Filtros** - Por categoria, localização e texto
- **Categorias Padrão** - 8 categorias pré-configuradas:
  - Eletrônicos, Veículos, Imóveis, Móveis
  - Roupas, Esportes, Livros, Outros
- **Contato WhatsApp** - Negociação direta com vendedores
- **Interface PWA** - Responsivo mobile/desktop
- **Sistema de Impulsionamento** - Anúncios pagos com PIX via Mercado Pago:
  - Promoções configuráveis (preço, duração)
  - Pagamento PIX instantâneo
  - Seção de destaque na homepage
  - Expiração automática (5-10 dias)
  - Badge "Destaque" nos anúncios impulsionados
- **Painel Administrativo Completo**:
  - Gerenciamento de promoções de boost
  - Controle de anúncios impulsionados
  - Relatórios de receita e estatísticas
- **Páginas Funcionais**:
  - **Home** - Lista de produtos com seção de anúncios impulsionados
  - **Criar** - Formulário de anúncios
  - **Info** - Informações e dicas de segurança

### ✅ Sistema de Usuários e Autenticação (Ativo)
- **Login/Registro** - Sistema completo de usuários
- **Dashboard do Usuário** - Interface "Meu Perfil" estilo app nativo
- **Gerenciamento de Anúncios** - CRUD completo de anúncios por usuário
- **Sistema de Notificações** - Modal funcional tipo app social
- **Perfil de Usuário** - Edição de dados pessoais incluindo CPF

## API Endpoints

### ✅ Endpoints Ativos e Funcionais

#### Produtos
- `GET /api/ads` - **Listar produtos** (público)
  - Query params: `categoryId`, `location`, `search`, `limit`, `offset`
  - Response: Array de produtos com detalhes completos
- `GET /api/ads/:id` - **Detalhes do produto** (público)
  - Response: Produto individual com informações do vendedor
- `POST /api/ads` - **Criar produto** (requer autenticação)
  - Body: `title`, `description`, `price`, `location`, `whatsapp`, `categoryId`, `imageUrl`
  - Response: Produto criado com ID gerado
- `PATCH /api/ads/:id` - **Editar produto** (requer autenticação)
- `DELETE /api/ads/:id` - **Pausar produto** (requer autenticação)

#### Categorias
- `GET /api/categories` - **Listar categorias** (público)
  - Response: 8 categorias padrão com ícones

#### Sistema de Impulsionamento
- `GET /api/boost/promotions` - **Listar promoções** (público)
  - Response: Array de promoções ativas com preços e durações
- `POST /api/boost/create` - **Criar impulsionamento** (público, sem auth)
  - Body: `adId`, `promotionId`, `payerName`, `payerLastName`, `payerCpf`, `payerEmail?`, `payerPhone?`
  - Response: QR Code PIX e dados do pagamento
- `GET /api/boost/status/:id` - **Status do pagamento** (público)
  - Response: Status do pagamento e detalhes do impulsionamento
- `POST /api/boost/webhook` - Webhook do Mercado Pago (interno)
- `GET /api/ads/featured` - **Anúncios impulsionados ativos** (público)
  - Response: Array de anúncios em destaque

#### Autenticação e Usuário
- `POST /api/auth/login` - **Login de usuário**
- `POST /api/auth/register` - **Registro de usuário**
- `GET /api/auth/user` - **Dados do usuário logado**
- `GET /api/user/ads` - **Anúncios do usuário**
- `PUT /api/user/profile` - **Atualizar perfil**
- `POST /api/upload/image` - **Upload de imagens**

#### Notificações
- `GET /api/notifications` - **Listar notificações do usuário**
- `PATCH /api/notifications/:id/read` - **Marcar como lida**
- `DELETE /api/notifications/:id` - **Deletar notificação**

#### Sistema
- `GET /` - Frontend React PWA

#### Administração - Sistema de Impulsionamento
- `GET /api/admin/boost/promotions` - Listar todas as promoções
- `POST /api/admin/boost/promotions` - Criar nova promoção
- `PUT /api/admin/boost/promotions/:id` - Editar promoção
- `DELETE /api/admin/boost/promotions/:id` - Deletar promoção
- `GET /api/admin/boost/ads` - Listar todos os anúncios impulsionados
- `PATCH /api/admin/boost/ads/:id/toggle` - Ativar/pausar impulsionamento

### ❌ Endpoints Desabilitados (Retornam 501)
- `GET/POST/DELETE /api/favorites/*` - Sistema de favoritos (futuro)

## Segurança
- Sessões seguras com PostgreSQL
- Validação de dados com Zod
- SQL injection protegido pelo Drizzle ORM
- CORS configurado
- Rate limiting (recomendado para produção)
- Pagamentos seguros via Mercado Pago

## Configuração do Sistema de Impulsionamento

### 1. Configuração do Mercado Pago
1. Crie uma conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Obtenha seu **Access Token** (sandbox para testes, produção para ambiente real)
3. Configure a variável `MERCADOPAGO_ACCESS_TOKEN` no .env
4. Configure a `BASE_URL` para receber webhooks de pagamento

### 2. Como Funciona
1. **Usuário acessa o botão "Impulsionar"** em qualquer anúncio
2. **Escolhe uma promoção** (Básico 5 dias, Premium 10 dias, etc.)
3. **Preenche dados** (Nome, Sobrenome, CPF obrigatórios)
4. **Sistema gera PIX** via Mercado Pago com QR Code
5. **Usuário paga PIX** pelo app do banco
6. **Webhook confirma pagamento** automaticamente
7. **Anúncio vai para seção destaque** imediatamente
8. **Expira automaticamente** após o período contratado

### 3. Administração
- **Painel Admin > Promoções**: Configure preços e durações
- **Painel Admin > Impulsionados**: Monitore pagamentos e status
- **Relatórios**: Visualize receita total e estatísticas

### 4. Preços Padrão (configuráveis)
- **Impulso Básico**: R$ 9,99 por 5 dias
- **Impulso Premium**: R$ 19,99 por 10 dias

## Performance ⚡

### Build Otimizado
- **Frontend:** 496KB → 151KB (gzipped)
- **CSS:** 64KB → 11KB (gzipped) 
- **HTML:** 2KB → 0.9KB (gzipped)
- **Vite Build:** ~8 segundos
- **Backend Build:** esbuild bundle otimizado

### Runtime
- PWA com service worker
- React Query para cache de dados
- Componentes lazy-loaded
- PostgreSQL com índices otimizados
- Express.js performático

## Status de Deploy ✅

### ✅ Funcionalidades Testadas em Produção
1. **Servidor Express** - Port 5000 ativo
2. **PostgreSQL** - Schema aplicado com sucesso
3. **Migrações** - Drizzle-kit funcionando
4. **API Endpoints** - Todos testados
5. **Frontend PWA** - Assets servidos corretamente
6. **Categorias** - 8 categorias pré-criadas
7. **Container Docker** - Estável e funcional
8. **Interface Nativa** - UserDashboard reformulado como "Meu Perfil"
9. **Sistema de Notificações** - Modal funcional tipo app social
10. **Upload de Imagens** - Endpoint implementado com base64
11. **Filtros de Categoria** - Navegação dinâmica funcionando
12. **Deleção de Anúncios** - Endpoint DELETE implementado
13. **Campo CPF** - Adicionado ao perfil para impulsionamento

### Build Pipeline
```bash
✅ npm ci (441 packages)
✅ vite build (2654 modules)
✅ esbuild backend bundle
✅ npm run db:push (schema)
✅ Express server start
```

## Troubleshooting 🔧

### ✅ Problemas Resolvidos
- **Vite não encontrado** → Movido para dependencies
- **Plugins Replit ausentes** → Removidos da configuração
- **Tailwind typography** → Adicionado às dependencies
- **cross-env not found** → Removido do script de produção
- **Tabelas ausentes** → Auto-migração no startup
- **MyAds import error** → Arquivo removido e rotas limpas

### Monitoramento
- **Desenvolvimento:** Console + terminal
- **Produção:** Express logs com timestamps
- **Database:** PostgreSQL query logs
- **Deploy:** EasyPanel build logs

## Roadmap 🚀

### Próximas Funcionalidades
- [x] Upload real de imagens ✅
- [x] Sistema de notificações funcional ✅
- [x] Interface nativa para mobile ✅
- [ ] Sistema de avaliações e feedback
- [ ] Cache Redis para performance  
- [ ] Analytics e métricas de uso
- [ ] Testes automatizados (Jest/Cypress)
- [ ] Rate limiting para API
- [ ] Monitoramento com Winston logs
- [ ] Deploy multi-ambiente
- [ ] CDN para assets estáticos
- [ ] Sistema de favoritos

### Funcionalidades Avançadas (Futuro)
- [ ] Chat integrado entre compradores/vendedores
- [ ] Notificações push PWA
- [ ] Geolocalização automática  
- [ ] Sistema de moderação de conteúdo
- [ ] API pública com documentação
- [ ] App mobile nativo (React Native)
- [ ] Integração com pagamentos
- [ ] Sistema de entrega/logística

## Deploy Automatizado 🚀

### Processo de Commit e Deploy
**SEMPRE** seguir estes passos após implementar novas funcionalidades:

1. **Commit das Alterações**
```bash
git add .
git commit -m "Descrição das alterações

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

2. **Acionar Deploy Automático**
```bash
curl -X GET "http://89.28.236.67:3000/api/deploy/43556f2e6831c6b993ae52949a4f9938b7b44d914b7c3b6a"
```

### Webhook de Deploy
- **URL**: `http://89.28.236.67:3000/api/deploy/43556f2e6831c6b993ae52949a4f9938b7b44d914b7c3b6a`
- **Método**: GET
- **Resposta**: `"Deploying..."`
- **Ação**: Baixa código do GitHub e reconstrói container Docker

### ⚠️ Problemas Conhecidos de Deploy
- **"no space left on device"** - Erro de espaço em disco no servidor
- **Solução**: Aguardar limpeza automática do servidor ou contactar administrador

## 🎉 Status Final
**MARKETPLACE PWA 100% FUNCIONAL EM PRODUÇÃO!**

O aplicativo foi desenvolvido, testado e deployado com sucesso. Todas as funcionalidades principais estão operacionais e o sistema está pronto para uso em ambiente de produção.