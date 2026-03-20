# Club Deportivo Trocha y Ruta

Sitio web oficial del **Club Deportivo Trocha y Ruta** — club de ciclomontañismo para ninos desde los 4 anos, fundado en 2010 en Yumbo, Valle del Cauca, Colombia.

> *Deporte, formacion y contacto con la naturaleza*

## Stack

| Capa | Tecnologia |
|------|-----------|
| Framework | [Astro](https://astro.build) 5 (SSG estatico) |
| Estilos | [Tailwind CSS](https://tailwindcss.com) 4 via Vite plugin |
| Islands | [React](https://react.dev) 19 (5 componentes interactivos) |
| CMS | [Sveltia CMS](https://github.com/sveltia/sveltia-cms) |
| Hosting | [Hostinger](https://www.hostinger.com) + GitHub Actions (FTPS) |
| Formularios | [Web3Forms](https://web3forms.com) |
| Imagenes | Astro Image + [Cloudinary](https://cloudinary.com) |

## Requisitos

- Node.js >= 20
- npm

## Inicio rapido

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/trocha-y-ruta.git
cd trocha-y-ruta

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El sitio estara disponible en `http://localhost:4321`.

## Scripts

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de produccion (incluye type-checking) |
| `npm run preview` | Preview del build local |
| `npm run lint` | Ejecutar ESLint |
| `npm run lint:fix` | ESLint con auto-fix |
| `npm run format` | Formatear con Prettier |
| `npm run format:check` | Verificar formato sin escribir |
| `npm run typecheck` | Type-checking con `astro check` |

## Estructura del proyecto

```
src/
├── assets/           # Imagenes y recursos estaticos
├── components/
│   ├── interactive/  # React Islands (5 componentes)
│   ├── sections/     # Secciones de pagina (Hero, Stats, etc.)
│   └── ui/           # Componentes UI reutilizables
├── content/          # 11 Content Collections (riders, events, news...)
├── layouts/          # BaseLayout, PageLayout, PostLayout
├── lib/              # Utilidades (SEO, helpers)
├── pages/            # 18 paginas (Astro file-based routing)
├── styles/           # global.css con tokens Tailwind 4
└── types/            # TypeScript types compartidos
public/
├── admin/            # Sveltia CMS (config.yml + index.html)
└── fonts/            # Inter Variable, Plus Jakarta Sans
```

## Content Collections

El sitio gestiona 11 colecciones de contenido:

| Coleccion | Tipo | Descripcion |
|-----------|------|-------------|
| `riders` | content | Corredores del club |
| `directivos` | content | Equipo directivo y staff |
| `news` | content | Noticias y articulos |
| `events` | content | Calendario de competencias |
| `results` | data | Resultados (YAML/JSON) |
| `programs` | content | Programas de formacion |
| `testimonials` | content | Testimonios de familias |
| `sponsors` | content | Patrocinadores |
| `gallery` | content | Albumes fotograficos |
| `rutas` | content | Rutas de entrenamiento |
| `pages` | content | Paginas estaticas editables |

## React Islands

Astro genera zero JavaScript por defecto. Solo 5 componentes usan React para interactividad:

- **MobileMenu** (`client:load`) — Menu hamburguesa mobile
- **ContactForm** (`client:visible`) — Formulario de contacto con validacion
- **InscriptionForm** (`client:visible`) — Formulario de inscripcion multi-paso
- **ImageLightbox** (`client:visible`) — Lightbox para galeria de fotos
- **TestimonialsCarousel** (`client:visible`) — Carrusel de testimonios

## Variables de entorno

Crear un archivo `.env` en la raiz:

```env
PUBLIC_WEB3FORMS_KEY=tu_api_key
PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
```

## CMS

El sitio incluye Sveltia CMS para edicion de contenido. Accesible en `/admin/` una vez desplegado.

## Deploy

El sitio se despliega automaticamente en **Hostinger** al hacer push a `main` via GitHub Actions con FTPS incremental.

### Configuracion

Agregar estos secrets en GitHub (`Settings > Secrets and variables > Actions`):

| Secret | Descripcion |
|--------|-------------|
| `FTP_SERVER` | Servidor FTP de Hostinger |
| `FTP_USERNAME` | Usuario FTP |
| `FTP_PASSWORD` | Contrasena FTP |

### Build manual

```bash
npm run build
# Los archivos estaticos se generan en dist/
```

## Licencia

Todos los derechos reservados. Club Deportivo Trocha y Ruta.
