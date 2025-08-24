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

### Disponíveis para Todos
- ✅ Visualizar produtos
- ✅ Pesquisar e filtrar por categoria/localização
- ✅ Ver detalhes do produto
- ✅ Criar anúncios (sem necessidade de registro)
- ✅ Contatar vendedor via WhatsApp
- ✅ Interface PWA responsiva

### Recursos Desabilitados
- ❌ Sistema de usuários/login
- ❌ Favoritos (requer autenticação)
- ❌ Gerenciamento de anúncios por usuário
- ❌ Edição/exclusão de anúncios

## API Endpoints

### Produtos
- `GET /api/ads` - Listar produtos (público)
- `GET /api/ads/:id` - Detalhes do produto (público)
- `POST /api/ads` - Criar produto (público)

### Categorias
- `GET /api/categories` - Listar categorias (público)

### Endpoints Desabilitados
- `PATCH /api/ads/:id` - Editar produto (501 - desabilitado)
- `DELETE /api/ads/:id` - Deletar produto (501 - desabilitado)
- `GET /api/user/ads` - Meus anúncios (501 - desabilitado)
- `GET/POST/DELETE /api/favorites/*` - Favoritos (501 - desabilitado)

## Segurança
- Sessões seguras com PostgreSQL
- Validação de dados com Zod
- SQL injection protegido pelo Drizzle ORM
- CORS configurado
- Rate limiting (recomendado para produção)

## Performance
- PWA com service worker
- Lazy loading de componentes
- Otimização de imagens (implementar)
- Cache de consultas (React Query)

## Troubleshooting

### Problemas Comuns
1. **Erro de conexão com banco**: Verifique DATABASE_URL
2. **Sessões não funcionam**: Configure SESSION_SECRET
3. **Build falha**: Execute `npm run check` para verificar tipos
4. **Docker não inicia**: Verifique se as portas estão livres

### Logs
- Desenvolvimento: Console do navegador + terminal
- Produção: Logs do servidor (implementar winston)

## Roadmap
- [ ] Upload de imagens
- [ ] Sistema de avaliações
- [ ] Chat integrado
- [ ] Notificações push
- [ ] Analytics
- [ ] Testes automatizados