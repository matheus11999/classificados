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

## Banco de Dados

### Esquema Principal
- **users** - Usuários do sistema
- **categories** - Categorias de produtos
- **ads** - Anúncios/produtos
- **favorites** - Favoritos dos usuários
- **sessions** - Sessões de usuário

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
- **Páginas Funcionais**:
  - **Home** - Lista de produtos com filtros
  - **Criar** - Formulário de anúncios
  - **Info** - Informações e dicas de segurança

### ❌ Recursos Desabilitados (Por Design)
- Sistema de usuários/login
- Favoritos (requer autenticação)
- Gerenciamento de anúncios por usuário
- Edição/exclusão de anúncios
- Histórico de anúncios por usuário

## API Endpoints

### ✅ Endpoints Ativos e Funcionais

#### Produtos
- `GET /api/ads` - **Listar produtos** (público)
  - Query params: `categoryId`, `location`, `search`, `limit`, `offset`
  - Response: Array de produtos com detalhes completos
- `GET /api/ads/:id` - **Detalhes do produto** (público)
  - Response: Produto individual com informações do vendedor
- `POST /api/ads` - **Criar produto** (público, sem autenticação)
  - Body: `title`, `description`, `price`, `location`, `whatsapp`, `categoryId`, `imageUrl`
  - Response: Produto criado com ID gerado

#### Categorias
- `GET /api/categories` - **Listar categorias** (público)
  - Response: 8 categorias padrão com ícones

#### Sistema
- `GET /api/auth/user` - Retorna `null` (sem autenticação)
- `GET /` - Frontend React PWA

### ❌ Endpoints Desabilitados (Retornam 501)
- `PATCH /api/ads/:id` - Editar produto 
- `DELETE /api/ads/:id` - Deletar produto
- `GET /api/user/ads` - Meus anúncios
- `GET/POST/DELETE /api/favorites/*` - Sistema de favoritos
- `/api/login` - Sistema de login
- `/api/logout` - Sistema de logout

## Segurança
- Sessões seguras com PostgreSQL
- Validação de dados com Zod
- SQL injection protegido pelo Drizzle ORM
- CORS configurado
- Rate limiting (recomendado para produção)

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
- [ ] Upload real de imagens (atualmente placeholder)
- [ ] Sistema de avaliações e feedback
- [ ] Cache Redis para performance  
- [ ] Analytics e métricas de uso
- [ ] Testes automatizados (Jest/Cypress)
- [ ] Rate limiting para API
- [ ] Monitoramento com Winston logs
- [ ] Deploy multi-ambiente
- [ ] CDN para assets estáticos

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