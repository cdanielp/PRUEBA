# Comfy Credits Platform

Plataforma de generación IA con sistema de créditos. ComfyDeploy como backend de generación, Neon PostgreSQL como DB, NextAuth para auth.

## Setup (5 minutos)

### 1. Clonar e instalar

```bash
git clone <tu-repo>
cd comfy-credits
npm install
```

### 2. Crear base de datos en Neon

1. Ve a [neon.tech](https://neon.tech) y crea cuenta gratis
2. Crea un nuevo proyecto (región: US East)
3. Copia el connection string

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
DATABASE_URL="tu_connection_string_de_neon"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
COMFY_DEPLOY_API_KEY="tu_api_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Crear tablas y datos iniciales

```bash
npx prisma db push
npx prisma generate
npx tsx prisma/seed.ts
```

Esto crea:
- 3 paquetes de créditos (Básico $99, Creator $249, Pro $699)
- 1 workflow "Text to Image" (2 créditos)
- 1 usuario admin: admin@promptmodels.studio / admin123456

### 5. Actualizar Deployment ID

Desde el admin panel o editando el seed, pon tu deployment ID real de ComfyDeploy.

### 6. Configurar webhook en ComfyDeploy

URL del webhook: `https://tu-dominio.com/api/webhook`

### 7. Correr

```bash
npm run dev
```

## Estructura

```
app/
├── api/
│   ├── auth/register/         Registro con 5 créditos gratis
│   ├── generate/              ENDPOINT PRINCIPAL - genera con créditos
│   ├── webhook/               Receptor de ComfyDeploy
│   ├── credits/               Saldo y ledger del usuario
│   ├── generations/           Historial y polling de estado
│   ├── workflows/             Listar workflows activos
│   └── admin/
│       ├── users/             Listar usuarios
│       ├── users/[id]/credits Ajustar créditos manualmente
│       └── workflows/         CRUD de workflows
├── dashboard/                 Panel del usuario
│   ├── page.tsx               Interfaz de generación
│   ├── history/               Historial
│   └── credits/               Saldo y movimientos
├── admin/                     Panel admin
│   ├── page.tsx               Usuarios + ajuste de créditos
│   └── workflows/             Gestión de workflows
├── login/
└── register/

lib/
├── auth.ts                    NextAuth config + requireAdmin
├── credits.ts                 Transacciones atómicas (deducir/reembolsar/ajustar)
├── comfy-deploy.ts            Cliente API ComfyDeploy (server-only)
└── db.ts                      Prisma client
```

## Flujo de generación

```
1. POST /api/generate { workflowId, inputs }
2. Verificar auth
3. Verificar créditos >= costo
4. Verificar runs concurrentes < 2
5. Deducir créditos (atómico, optimista)
6. POST a ComfyDeploy queue
7. Si ComfyDeploy falla → reembolso inmediato
8. Frontend hace polling cada 3s
9. Webhook llega → actualiza estado
10. Si webhook = failed → reembolso automático
```

## Admin: Agregar créditos manualmente

1. Login como admin
2. Ir a Admin → Usuarios
3. Buscar usuario por email
4. Click "Ajustar créditos"
5. Poner cantidad positiva y motivo
6. Aplicar

Todo queda registrado en el ledger con quién hizo el ajuste.

## Deploy en Vercel

```bash
vercel
```

Configurar en Vercel Dashboard → Settings → Environment Variables todas las vars del `.env.local`.

## Seguridad implementada

- API Key nunca en frontend
- Deducción atómica con WHERE credits >= cost
- Máximo 2 runs concurrentes por usuario
- Validación de firma HMAC en webhooks
- Sanitización de inputs (maxLength, tipos)
- Rutas admin protegidas por middleware + role check
- Ledger completo de todas las transacciones
- Reembolso automático en fallos
