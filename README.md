# Ofertando — Documentación del Frontend

## Visión General

Ofertando es un frontend e-commerce headless construido con **Next.js 14 (App Router)**, conectado a un backend de **WordPress + WooCommerce** a través de **WPGraphQL** y **REST API de WooCommerce**.

## Arquitectura

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────────┐
│   Next.js 14    │────▶│   WPGraphQL         │────▶│  WordPress + WooCommerce │
│   (Frontend)    │     │   (GraphQL API)     │     │  (Backend)               │
└─────────────────┘     └──────────────────────┘     └─────────────────────────┘
         │                        │                         │
         │  GraphQL Queries       │  REST API               │  WC REST API
         ▼                        ▼                         ▼
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│ Apollo Client   │     │   Customer Lookup   │     │  WooCommerce REST  │
│ (Data Fetch)   │     │   (by email)        │     │  (Orders, Users)   │
└─────────────────┘     └──────────────────────┘     └──────────────────────┘
                               │
                               │  JWT Token
                               ▼
┌─────────────────┐     ┌──────────────────────┐
│  NextAuth.js   │────▶│  Transbank Webpay   │
│   (Auth)       │     │  Plus              │
└─────────────────┘     └──────────────────────┘
```

## Stack Tecnológico

| Capa                     | Tecnología                                 |
| ------------------------ | ------------------------------------------ |
| Framework                | Next.js 14 (App Router)                    |
| Lenguaje                 | TypeScript (strict mode)                   |
| Estilos                  | Tailwind CSS                               |
| Fetching (GraphQL)       | Apollo Client 4                            |
| Fetching (REST)          | fetch nativo                               |
| Estado global            | Zustand (con persistencia en localStorage) |
| Autenticación            | NextAuth.js v4 (JWT desde WordPress)       |
| Pagos                    | Transbank Webpay Plus SDK                  |
| Analítica                | Meta Pixel (react-facebook-pixel)          |
| Optimización de imágenes | next/image + Sharp                         |

## Estructura de Directorios

```
src/
├── app/                          # Páginas del App Router de Next.js
│   ├── (auth)/                   # Grupo de rutas de autenticación
│   │   ├── login/
│   │   └── registro/
│   ├── (tienda)/                # Grupo de rutas de tienda (sin prefijo en URL)
│   │   ├── catalogo/
│   │   │   └── [slug]/          # Detalle de producto (SSG)
│   │   ├── carrito/             # Página del carrito
│   │   └── checkout/
│   │       ├── exito/          # Página de éxito post-pago
│   │       └── confirmacion/    # Confirmación post-pago
│   ├── api/                     # Rutas API
│   │   ├── auth/[...nextauth]/ # Handler de NextAuth
│   │   ├── transbank/          # Integración con Webpay
│   │   │   ├── create/         # POST - Iniciar transacción
│   │   │   ├── commit/         # POST - Confirmar transacción
│   │   │   └── status/         # GET - Consultar estado
│   │   ├── user/
│   │   │   ├── shipping-data/ # GET - Obtener datos de envío del cliente
│   │   │   └── update-profile/ # POST - Actualizar perfil del cliente
│   │   └── orders/
│   │       └── create/         # POST - Crear pedido (referencia)
│   ├── mi-cuenta/              # Dashboard de Mi Cuenta
│   │   ├── page.tsx            # Página principal
│   │   └── pedidos/           # Vista de pedidos (Server Component)
│   ├── layout.tsx              # Layout principal con Header, Footer, WhatsApp
│   ├── page.tsx                # Homepage
│   ├── sitemap.ts              # Sitemap dinámico
│   └── robots.ts               # Configuración de robots
├── components/
│   ├── ui/                     # Componentes base (Button, Badge, Skeleton)
│   ├── layout/                # Header, Footer, Nav, WhatsAppButton
│   ├── product/               # ProductCard, ProductGrid, ProductFilters
│   └── checkout/              # CartDrawer, CheckoutForm
├── providers/
│   └── AuthProvider.tsx        # SessionProvider encapsulado (cliente)
├── lib/
│   ├── apollo.ts              # Apollo Client para Componentes de Cliente
│   ├── apollo-server.ts       # Apollo Client para Server Components
│   ├── auth.ts                # Configuración de NextAuth
│   └── transbank.ts           # Instancia del SDK de Webpay
├── graphql/
│   ├── queries/               # Definiciones de queries GraphQL
│   │   ├── products.ts
│   │   ├── categories.ts
│   │   └── pages.ts           # Páginas y Landing Page
│   ├── mutations/            # Mutaciones GraphQL
│   ├── lib/
│   │   ├── categories.ts      # Utilidades para categorías jerárquicas
├── hooks/
│   └── usePixel.ts            # Eventos de tracking de Meta Pixel
├── store/
│   └── cart.ts                # Store de carrito con Zustand (persistido)
└── types/
    ├── product.ts
    ├── cart.ts
    └── order.ts
```

## Comunicación con el Backend

### GraphQL (WPGraphQL + WooGraphQL)

**Endpoint:** `NEXT_PUBLIC_GRAPHQL_URL` (ej., `https://tudominio.cl/graphql`)

Todas las queries GraphQL usan **fragmentos en línea** (`... on SimpleProduct`) porque WooGraphQL expone los tipos de productos a través de interfaces:

```graphql
query getProducts {
  products(first: 50) {
    nodes {
      id
      name
      slug
      image {
        sourceUrl
      }
      ... on SimpleProduct {
        price
        regularPrice
        stockStatus
      }
      productCategories {
        nodes {
          name
          slug
        }
      }
    }
  }
}
```

**Queries Disponibles:**

- `GET_PRODUCTS` — Listar productos con paginación
- `GET_PRODUCT_BY_SLUG` — Un producto por slug
- `GET_FEATURED_PRODUCTS` — Solo productos destacados
- `GET_PRODUCT_SLUGS` — Todos los slugs (para generateStaticParams)
- `GET_CATEGORIES` — Categorías de productos (jerárquicas)
- `GET_CATEGORY_BY_SLUG` — Una categoría por slug
- `SEARCH_PRODUCTS` — Búsqueda por término
- `GET_LANDING_PAGE` — Datos de la Landing Page (ACF)
- `GET_PAGE_BY_URI` — Página por URI

### Configuración de Apollo Client

**Server Components** (`apollo-server.ts`):

```typescript
// Crea una nueva instancia de cliente por request (sin caché compartida)
export const getClient = () =>
  new ApolloClient({
    cache: new InMemoryCache(),
    link: createHttpLink({ uri: process.env.NEXT_PUBLIC_GRAPHQL_URL }),
  });
```

**Client Components** (`apollo.ts`):

```typescript
// Cliente compartido para fetching de datos del lado del cliente
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  credentials: "include", // Requerido para sesiones de WooCommerce
});
```

### Tipos de Productos en WooGraphQL

WooGraphQL usa un tipo union para productos. Siempre usar fragmentos:

| Tipo de Producto  | Fragmento                |
| ----------------- | ------------------------ |
| Producto Simple   | `... on SimpleProduct`   |
| Producto Variable | `... on VariableProduct` |
| Producto Externo  | `... on ExternalProduct` |

> **Importante:** El tipo `Product` ahora incluye `databaseId?: number` para usar con REST API de WooCommerce.

## Flujo de Pago (Transbank Webpay Plus)

```
Usuario llena checkout → POST /api/transbank/create
                              │
                              ▼
                    Transbank retorna { token, url }
                    Se crea cookie "pending_order" con datos del pedido
                              │
                              ▼
                    Frontend redirige a URL de Transbank
                              │
                              ▼
              Usuario completa el pago en formulario de Transbank
                              │
                              ▼
              Transbank redirige a /api/transbank/commit?token_ws=...
                              │
                              ▼
                    POST /api/transbank/commit
                              │
                              ├──► AUTHORIZED → 1. Confirmar pago con Webpay
                              │              2. Buscar customer ID por email (REST)
                              │              3. Crear pedido en WooCommerce (REST)
                              │              4. Limpiar carrito
                              │              5. Mostrar confirmación
                              │              6. Disparar evento Meta Pixel "Purchase"
                              │
                              └──► REJECTED → Mostrar error, redirigir a checkout
```

### Detalle del Flujo

1. **Inicio (`/api/transbank/create`):**
   - Recibe items del carrito, email del cliente, datos de facturación
   - Mapea productos a formato REST (`product_id`, `quantity`)
   - Guarda todo en cookie HTTPOnly `pending_order`

2. **Confirmación (`/api/transbank/commit`):**
   - Lee cookie `pending_order`
   - Confirma transacción con Webpay
   - **Customer Lookup** por email → obtiene `customer_id`
   - **Crea pedido** en WooCommerce REST API
   - Limpia cookie y carrito

### Reglas de Seguridad

- `TRANSBANK_COMMERCE_CODE` y `TRANSBANK_API_KEY` son **solo servidor** (sin prefijo `NEXT_PUBLIC_`)
- El frontend **nunca** importa `src/lib/transbank.ts` directamente
- Toda la comunicación con Webpay pasa por las rutas API `/api/transbank/*`
- El `returnUrl` para Transbank siempre apunta al endpoint de commit en el mismo dominio

### Endpoints de API

| Endpoint                   | Método | Propósito                                                    |
| -------------------------- | ------ | ------------------------------------------------------------ |
| `/api/transbank/create`    | POST   | Iniciar transacción Webpay, crea cookie con datos del pedido |
| `/api/transbank/commit`    | POST   | Confirmar transacción y crear pedido en WooCommerce          |
| `/api/transbank/status`    | GET    | Consultar estado de transacción                              |
| `/api/user/shipping-data`  | GET    | Obtener datos de envío del cliente                           |
| `/api/user/update-profile` | POST   | Actualizar perfil del cliente                                |

## API REST de WooCommerce

El proyecto usa la **REST API de WooCommerce** para operaciones de clientes y pedidos.

### Autenticación

Usar **Basic Auth** con Consumer Keys:

```typescript
const authHeader =
  "Basic " +
  Buffer.from(
    `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`,
  ).toString("base64");
```

### Endpoints Disponibles

| Recurso   | Endpoint                             | Propósito                               |
| --------- | ------------------------------------ | --------------------------------------- |
| Clientes  | `/wp-json/wc/v3/customers?email=...` | Buscar cliente por email                |
| Pedidos   | `/wp-json/wc/v3/orders`              | Crear/Listar pedidos                    |
| Productos | `/wp-json/wc/v3/products`            | Listar productos (no usado activamente) |

### Customer Lookup

Para vincular un pedido a un cliente existente, buscar por email:

```typescript
const response = await fetch(
  `${WP_REST_URL}/wc/v3/customers?email=${encodeURIComponent(email)}`,
  { headers: { Authorization: authHeader } },
);
const customers = await response.json();
const customerId = customers[0]?.id; // ID del cliente en WooCommerce
```

### Creación de Pedidos

Después de un pago exitoso en Webpay, crear el pedido en WooCommerce:

```typescript
const orderPayload = {
  status: "processing",
  customer_id: customerId,
  billing: {
    first_name,
    last_name,
    email,
    phone,
    address_1,
    city,
    state,
    country: "CL",
  },
  shipping: { first_name, last_name, address_1, city, state, country: "CL" },
  line_items: [{ product_id: 123, quantity: 1 }],
};

await fetch(`${WP_REST_URL}/wc/v3/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: authHeader },
  body: JSON.stringify(orderPayload),
});
```

## Autenticación (NextAuth.js)

**Proveedor:** JWT de WordPress (`/jwt-auth/v1/token`)

### Importante: Formato de la petición

El endpoint JWT de WordPress requiere `Content-Type: application/x-www-form-urlencoded`, NO JSON:

```typescript
// ✅ Formato correcto
const body = new URLSearchParams({
  username: credentials.username,
  password: credentials.password,
});

fetch(`${wpUrl}/jwt-auth/v1/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body,
});

// ❌ Formato incorrecto (JSON)
fetch(`${wpUrl}/jwt-auth/v1/token`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
});
```

### Configuración (`src/lib/auth.ts`)

- Usa `CredentialsProvider` con el endpoint JWT de la REST API de WordPress
- **Usa URLSearchParams** para el body de la petición
- Estrategia JWT con sesión de 24 horas
- Token almacenado en sesión para gestión de sesiones de WooCommerce

### Rutas Protegidas

El middleware (`src/middleware.ts`) protege:

- `/checkout` — Requiere autenticación
- `/mi-cuenta/*` — Requiere autenticación

Usuarios sin autenticación son redirigidos a `/login?redirect=<ruta-original>`.

### Flujo de Redirección Post-Login

```
1. Usuario accede a /checkout sin sesión
   → Middleware detecta token ausente
   → Redirige a /login?redirect=/checkout

2. Usuario ingresa credenciales en /login
   → signIn("credentials", { username, password })
   → NextAuth valida contra /wp-json/jwt-auth/v1/token

3. Login exitoso
   → router.push(redirect) → /checkout
   → Sesión JWT creada con maxAge 24h
```

---

## Seguridad

### Autenticación JWT de WordPress

El sistema usa JWT (JSON Web Tokens) para autenticar usuarios contra WordPress.

**Flujo de credenciales:**

```
1. Usuario envia email + contraseña
   ↓
2. NextAuth → POST /wp-json/jwt-auth/v1/token
   {
     "username": "usuario@email.cl",
     "password": "contraseña"
   }
   ↓
3. WordPress valida y retorna:
   {
     "token": "eyJ...",
     "user_email": "...",
     "user_display_name": "...",
     "user_id": "..."
   }
   ↓
4. Token JWT almacenado en cookie de sesión (httpOnly, secure)
```

**Archivo:** `src/lib/auth.ts` — `authorize()`

### Cifrado y Protección de Tokens

| Aspecto                  | Implementación                                                          |
| ------------------------ | ----------------------------------------------------------------------- |
| Algoritmo de firma       | HS256 (configurado por el plugin JWT de WordPress)                      |
| Almacenamiento del token | Cookie de sesión `next-auth.session-token` (httpOnly, secure, sameSite) |
| Duración de sesión       | 24 horas (`maxAge: 24 * 60 * 60`)                                       |
| Secreto de firma         | `NEXTAUTH_SECRET` (generado con `openssl rand -base64 32`)              |
| Estrategia anti-CSRF     | Tokens firmados digitalmente                                            |

**En el navegador:** El token JWT nunca es accesible via JavaScript (`httpOnly`). Solo es enviado automáticamente por el navegador en cada request.

**En el servidor:** El token se verifica usando `NEXTAUTH_SECRET` en cada invocación de callbacks de NextAuth.

### Middleware (`src/middleware.ts`)

```typescript
// Verifica token JWT en cada request a rutas protegidas
// Si no hay token → redirige a /login?redirect=<ruta original>
```

**Rutas que no requieren autenticación:**

- `/login`, `/registro`
- `/catalogo`, `/catalogo/*`
- `/` (homepage)
- `/api/*`

### Credenciales de Transbank (Webpay Plus)

| Variable                  | Visibilidad        | Propósito                            |
| ------------------------- | ------------------ | ------------------------------------ |
| `TRANSBANK_COMMERCE_CODE` | **Servidor solo**  | Identificador del comercio           |
| `TRANSBANK_API_KEY`       | **Servidor solo**  | Clave secreta de la API              |
| `NEXT_PUBLIC_*`           | Cliente y servidor | NINGUNA credencial de Transbank aquí |

**Regla:** `TRANSBANK_*` nunca tiene prefijo `NEXT_PUBLIC_`. Están disponibles únicamente en:

- `src/lib/transbank.ts` (nunca importado desde el cliente)
- `src/app/api/transbank/*/route.ts`

### Variables de Entorno de Seguridad

```env
# ============================================
# PRODUCCIÓN — Vercel Dashboard (nunca commitear)
# ============================================

# NextAuth (obligatorias)
NEXTAUTH_SECRET=           # openssl rand -base64 32
NEXTAUTH_URL=https://tudominio.cl

# WordPress JWT
NEXT_PUBLIC_WP_REST_URL=https://tudominio.cl/wp-json

# WooCommerce REST API (para pedidos y clientes)
WC_CONSUMER_KEY=           # Consumer Key de WooCommerce
WC_CONSUMER_SECRET=       # Consumer Secret de WooCommerce

# Transbank (protegidas, solo servidor)
TRANSBANK_COMMERCE_CODE=
TRANSBANK_API_KEY=
TRANSBANK_ENVIRONMENT=integration   # "production" en Vercel
```

### WordPress: Plugin JWT requerido

En el backend de WordPress debe estar instalado y configurado el plugin **JWT Authentication for WP REST API**:

```php
// wp-config.php (en el servidor de WordPress)
define('JWT_AUTH_SECRET_KEY', 'tu-secret-key-aqui');
define('JWT_AUTH_CORS_ENABLE', true);
```

Sin este plugin y su configuración, el endpoint `/jwt-auth/v1/token` retorna error 403 y la autenticación falla.

## Integración con Meta Pixel

**Pixel ID:** `NEXT_PUBLIC_META_PIXEL_ID`

### Eventos

| Evento             | Disparador                             | Datos                        |
| ------------------ | -------------------------------------- | ---------------------------- |
| `PageView`         | Cada cambio de ruta                    | —                            |
| `ViewContent`      | Carga de página de detalle de producto | content_ids, value, currency |
| `AddToCart`        | Clic en botón agregar al carrito       | content_ids, value, currency |
| `InitiateCheckout` | Carga de página de checkout            | value, currency              |
| `Purchase`         | Confirmación post-pago                 | order_id, value, currency    |

### Protección contra AdBlockers

Meta Pixel se carga dinámicamente vía `import()` dentro de `useEffect` para prevenir errores cuando hay AdBlockers activos:

```typescript
// Patrón de carga seguro
import("react-facebook-pixel")
  .then((ReactPixel) => {
    ReactPixel.default.init(pixelId);
    ReactPixel.default.pageView();
  })
  .catch(() => {
    // Fallar silenciosamente si está bloqueado
  });
```

## Gestión de Estado (Zustand)

### Store del Carrito (`src/store/cart.ts`)

Persistido en `localStorage` bajo la clave `tienda-ricardo-cart`.

**Estado:**

```typescript
interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}
```

**Forma de CartItem:**

```typescript
interface CartItem {
  id: string; // ID Global (base64) ej: "cG9zdDoxMjM="
  databaseId?: number; // ID numérico de la base de datos (preferido para REST)
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}
```

> **Nota:** Siempre usar `databaseId` o decodificar el `id` (base64) para APIs REST de WooCommerce. Usar `atob(id).split(':')[1]` para obtener el ID numérico.

## Estrategias de Renderizado

| Página                   | Estrategia                 | Revalidación   |
| ------------------------ | -------------------------- | -------------- |
| `/` (Homepage)           | ISR                        | 3600s (1 hora) |
| `/catalogo`              | ISR                        | 1800s (30 min) |
| `/catalogo/[slug]`       | SSG + generateStaticParams | 3600s          |
| `/checkout`              | Dinámico (SSR)             | Sin caché      |
| `/checkout/confirmacion` | Dinámico (SSR)             | Sin caché      |
| `/mi-cuenta/pedidos`     | Server Component (REST)    | force-dynamic  |
| `/login`                 | Dinámico (SSR)             | Sin caché      |
| `/carrito`               | Estático (Client)          | —              |
| Rutas API                | Dinámico                   | Sin caché      |

## SEO

### Metadatos

Cada página de producto genera metadatos dinámicos vía `generateMetadata()`:

- Título: `{product.name} | Tienda Ricardo`
- Descripción: HTML limpio de `shortDescription`
- OpenGraph: Imagen del producto, locale `es_CL`
- URL canónica

### Schema.org JSON-LD

Las páginas de producto incluyen `application/ld+json` con schema de Producto:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "...",
  "description": "...",
  "image": "...",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "CLP",
    "price": "...",
    "availability": "https://schema.org/InStock"
  }
}
```

### Sitemap

Generado dinámicamente en `/sitemap.xml` con:

- Homepage (prioridad 1)
- Página de catálogo (prioridad 0.9)
- Todas las páginas de productos (prioridad 0.8, cambios semanales)

### Robots

Configurado en `/robots.txt`:

- Permitir todos los crawlers
- Bloquear `/api/` y `/checkout/confirmacion`

## Variables de Entorno

```env
# ============================================
# DESARROLLO — .env.local
# ============================================

# GraphQL
NEXT_PUBLIC_GRAPHQL_URL=https://tudominio.cl/graphql

# WordPress REST API
NEXT_PUBLIC_WP_REST_URL=https://tudominio.cl/wp-json

# WooCommerce REST API
WC_CONSUMER_KEY=
WC_CONSUMER_SECRET=

# NextAuth
NEXTAUTH_SECRET=                  # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Transbank (solo entorno de integración)
TRANSBANK_COMMERCE_CODE=
TRANSBANK_API_KEY=
TRANSBANK_ENVIRONMENT=integration

# Meta Pixel
NEXT_PUBLIC_META_PIXEL_ID=

# ============================================
# PRODUCCIÓN — Vercel Dashboard
# (los mismos nombres, valores de producción)
# ============================================
```

## Optimización de Imágenes

`next.config.mjs` configura `remotePatterns` para:

| Dominio               | Propósito                           |
| --------------------- | ----------------------------------- |
| `tudominio.cl`        | Imágenes subidas de WordPress       |
| `admin.ofertando.cl`  | Imágenes del dominio admin          |
| `images.unsplash.com` | Fotos de stock (hero, placeholders) |

Formatos: AVIF + WebP (defaults de Next.js)

## Comandos de Desarrollo

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Build de producción
npm run start        # Iniciar servidor de producción
npm run lint         # ESLint
npm run type-check   # TypeScript (tsc --noEmit)
```

## Checklist de Verificación para Deploy

Antes de desplegar, asegurar que:

- [ ] `npm run type-check` pasa sin errores
- [ ] `npm run lint` pasa sin warnings
- [ ] `npm run build` completa exitosamente
- [ ] Todas las queries GraphQL usan fragmentos correctos de WooGraphQL (`... on SimpleProduct`)
- [ ] `NEXT_PUBLIC_GRAPHQL_URL` apunta al endpoint GraphQL de producción
- [ ] `TRANSBANK_ENVIRONMENT=production` en Vercel (no local)
- [ ] Variables de entorno configuradas en Dashboard de Vercel

### Autenticación y Seguridad

- [ ] Plugin JWT instalado y activo en WordPress (`jwt-auth/v1/token` responde 200)
- [ ] `JWT_AUTH_SECRET_KEY` definido en `wp-config.php` del servidor WordPress
- [ ] `NEXTAUTH_SECRET` generado (`openssl rand -base64 32`) y configurado en Vercel
- [ ] `NEXTAUTH_URL` apunta a dominio de producción (sin trailing slash)
- [ ] Credenciales Transbank (`TRANSBANK_COMMERCE_CODE`, `TRANSBANK_API_KEY`) configuradas en Vercel (no en `.env`)
- [ ] Transbank en ambiente `production` (no `integration`) en Vercel
- [ ] Verificar flujo completo: `/checkout` → redirige a login → login exitoso → vuelve a `/checkout`

## Problemas Comunes

### "No se encontraron productos"

1. Verificar que el endpoint GraphQL es accesible
2. Confirmar que el plugin WooGraphQL está activo
3. Usar DevTools del navegador (pestaña Network) para inspeccionar la respuesta GraphQL
4. Asegurar que las queries usan fragmentos `... on SimpleProduct` para campos de precio

### Errores 500 de imágenes

Agregar el dominio de la imagen a `remotePatterns` en `next.config.mjs`:

```javascript
{
  protocol: "https",
  hostname: "tu-dominio.cl",
  pathname: "/wp-content/uploads/**",
}
```

### Precios muestran "$NaN" o se muestran incorrectamente

WooCommerce retorna precios como strings formateados en CLP (ej: `"$500.000"`). No usar `parseFloat()` directamente porque el punto se interpreta como decimal.

Para parsear correctamente:

```typescript
// Para guardar en el store (Zustand)
const price = parseInt(priceString.replace(/\$|\./g, ""), 10);

// Para formatear de vuelta a CLP en el frontend
price.toLocaleString("es-CL");
```

### Transbank retorna a checkout sin confirmar

Asegurar que `returnUrl` en `/api/transbank/create` apunta a la URL completa de commit:

```
${window.location.origin}/api/transbank/commit
```
## Sistema de Categorías Jerárquicas

### Estructura

El proyecto soporta categorías anidadas en WooCommerce. Las categorías se renderizan en un árbol visual en el sidebar del catálogo.

### Tipos

```typescript
interface Category {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description: string;
  image: ProductImage;
  count: number;
  parentId?: number | null;
}

interface CategoryTree extends Category {
  children: CategoryTree[];
}
```

### Utilidades (`src/lib/categories.ts`)

| Función                                   | Descripción                                              |
| ----------------------------------------- | -------------------------------------------------------- |
| `buildCategoryTree(categories)`           | Convierte lista plana en árbol jerárquico                |
| `getAllDescendantIds(category)`           | Obtiene array con ID del padre + todos los descendientes |
| `getCategoryBreadcrumb(categories, slug)` | Genera ruta de migas de pan                              |
| `findCategoryBySlug(categories, slug)`    | Busca categoría por slug en el árbol                     |

### Query GraphQL

Las categorías se obtienen con parent info:

```graphql
query GetCategories($first: Int) {
  productCategories(first: $first) {
    nodes {
      id
      databaseId
      name
      slug
      count
      parent {
        node {
          databaseId
        }
      }
    }
  }
}
```

### Flujo de Filtrado Jerárquico

1. Usuario hace clic en categoría (padre o hija)
2. URL actualiza con `?categoria=slug-de-categoria`
3. Server Component busca la categoría en el árbol
4. `getAllDescendantIds()` obtiene todos los IDs de subcategorías
5. Query de productos usa `categoryIdIn: [array_de_ids]`
6. Returns productos del padre Y todos sus hijos

---

## Landing Page Dinámica (ACF)

### Configuración ACF en WordPress

Se utiliza **Advanced Custom Fields** con **WPGraphQL for ACF** para hacer la Landing Page autogestionable.

### Página "Fantasma"

Se crea una página en WordPress con URI `/inicio/` que actúa como nodo de datos. NO se muestra públicamente, solo provee los campos ACF.

### Grupo de Campos (Type Name en GraphQL: `camposLanding`)

| Campo       | Tipo ACF           | Descripción               |
| ----------- | ------------------ | ------------------------- |
| `textoHero` | Text               | Título principal del Hero |
| `subtitulo` | Text               | Subtítulo del Hero        |
| `fondoHero` | Image (Return URL) | Imagen de fondo del Hero  |

### Query GraphQL

```graphql
query GetLandingPage($id: ID!, $idType: PageIdType!) {
  page(id: $id, idType: $idType) {
    camposLanding {
      textoHero
      subtitulo
      fondoHero {
        node {
          sourceUrl
        }
      }
    }
  }
}
```

### Fallbacks Defensivos

```typescript
const heroTitle = landingData?.textoHero || "Bienvenido a Ofertando";
const heroSubtitle = landingData?.subtitulo || "Descubre nuestra selección...";
const heroBackgroundUrl =
  landingData?.fondoHero?.node?.sourceUrl || "https://images.unsplash.com/...";
```

### Páginas que Usan estos Datos

| Página                             | Uso                                                        |
| ---------------------------------- | ---------------------------------------------------------- |
| `src/app/page.tsx`                 | `textoHero`, `subtitulo`, `fondoHero` (Hero de la landing) |
| `src/components/layout/Footer.tsx` | `subtitulo` (descripción del pie de página)                |

### Revalidación

La homepage usa ISR con `revalidate = 3600` (1 hora) para caché de los datos de ACF.

---

## Componentes Server-Side

### Footer (`src/components/layout/Footer.tsx`)

El Footer es un **Server Component async** que fetchea datos de ACF para mostrar el `subtitulo` dinámicamente.

```typescript
export default async function Footer() {
  const footerDescription = await getFooterDescription();
  const description = footerDescription || "Tu tienda online de ofertas...";
  // renderiza...
}
```

### Catálogo (`src/app/(tienda)/catalogo/page.tsx`)

El catálogo es un **Server Component** que:

1. Obtiene categorías jerárquicas
2. Lee `searchParams.categoria` para filtrado
3. Calcula IDs de subcategorías descendientes
4. Fetch Productos con `categoryIdIn`

### Producto Detalle (`src/app/(tienda)/catalogo/[slug]/page.tsx`)

Página dinámica con:

- SSG via `generateStaticParams`
- Metadata dinámica con `generateMetadata()`
- Schema.org JSON-LD

---
> Landing Page dinámica con ACF y sistema de categorías jerárquicas implementado.
> El cliente puede editar el título, subtítulo e imagen de fondo desde WordPress.
> Las subcategorías se filtran automáticamente al seleccionar una categoría padre.
