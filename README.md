# PWA Marketplace

Aplicativo web progressivo (PWA) para compra e venda de produtos sem necessidade de registro.

## 🚀 Deploy Rápido

### 1. Configure as variáveis de ambiente
Copie `.env.example` para `.env` e configure:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your_random_secret_key
NODE_ENV=production
PORT=5000
```

### 2. Instale dependências
```bash
npm install
```

### 3. Configure o banco de dados
```bash
npm run db:push
```

### 4. Execute
```bash
npm run build
npm start
```

## 🐳 Deploy com Docker

```bash
docker-compose up -d
```

## 🌟 Características

- ✅ **Sem registro necessário** - navegue e compre produtos
- ✅ **Crie anúncios facilmente** - sem necessidade de conta
- ✅ **Contato via WhatsApp** - negociação direta 
- ✅ **PWA responsivo** - funciona em mobile e desktop
- ✅ **PostgreSQL** - banco confiável e escalável
- ✅ **Interface moderna** - Tailwind CSS + React

## 📱 Funcionalidades

- Navegação por categorias
- Busca por localização
- Upload de fotos (placeholder)
- Filtros de pesquisa
- Interface dark/light mode
- Otimização para mobile

## 🔧 Desenvolvimento

```bash
npm run dev     # Modo desenvolvimento
npm run build   # Build para produção  
npm run check   # Verificar tipos TypeScript
```

Para mais detalhes técnicos, consulte `CLAUDE.md`.