# WatchPulse — Market Monitor (Cloud)

Plataforma de monitoreo de precios de relojes con base de datos en la nube.

**Stack:** React + Supabase + GitHub + Vercel

---

## PASO 1: Crear la base de datos en Supabase

1. Ve a **https://supabase.com** y crea una cuenta gratis (puedes usar Google)
2. Haz clic en **"New Project"**
3. Completa:
   - **Organization:** tu organización (se crea automáticamente)
   - **Project name:** `watchpulse`
   - **Database password:** elige una contraseña segura (guárdala)
   - **Region:** elige la más cercana (ej: US East para EEUU)
4. Espera 1-2 minutos a que se cree el proyecto
5. Ve a **SQL Editor** (ícono en la barra lateral izquierda)
6. Haz clic en **"New Query"**
7. Abre el archivo `supabase-schema.sql` incluido en este proyecto
8. **Copia TODO el contenido** y pégalo en el editor SQL de Supabase
9. Haz clic en **"Run"** (o Ctrl+Enter)
10. Deberías ver "Success" — tu base de datos está lista

### Obtener las credenciales de Supabase

1. Ve a **Project Settings** (ícono de engranaje, abajo en la barra lateral)
2. Haz clic en **"API"** en el menú lateral
3. Copia estos dos valores:
   - **Project URL** → es tu `VITE_SUPABASE_URL`
   - **anon public** (bajo Project API Keys) → es tu `VITE_SUPABASE_ANON_KEY`

---

## PASO 2: Subir el código a GitHub

1. Ve a **https://github.com** y crea una cuenta si no tienes
2. Haz clic en **"+"** → **"New repository"**
3. Nombre: `watchpulse` | Privado o Público | No agregues README
4. En tu computadora, abre la terminal en la carpeta del proyecto:

```bash
cd watchpulse-cloud
git init
git add .
git commit -m "WatchPulse v3 - Supabase cloud"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/watchpulse.git
git push -u origin main
```

---

## PASO 3: Desplegar en Vercel

1. Ve a **https://vercel.com** y regístrate con tu cuenta de GitHub
2. Haz clic en **"Add New" → "Project"**
3. Busca y selecciona el repositorio `watchpulse`
4. En la sección **"Environment Variables"**, agrega:

| Variable                  | Valor                                    |
|---------------------------|------------------------------------------|
| `VITE_SUPABASE_URL`      | `https://tu-proyecto.supabase.co`        |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` (tu anon key) |

5. Haz clic en **"Deploy"**
6. Espera 1-2 minutos
7. Vercel te dará una URL como `watchpulse-xyz.vercel.app`
8. **¡Comparte esa URL con Jeremy!** Ambos verán los mismos datos en tiempo real

---

## PASO 4: Configuración local (para desarrollo)

Si quieres trabajar en el código localmente:

```bash
cd watchpulse-cloud

# Crear archivo .env con tus credenciales
cp .env.example .env
# Edita .env y pega tus valores reales de Supabase

# Instalar dependencias
npm install

# Iniciar servidor local
npm run dev
```

Se abrirá en `http://localhost:5173`

---

## Estructura del proyecto

```
watchpulse-cloud/
├── index.html              ← Página HTML
├── package.json            ← Dependencias (React, Supabase, Recharts)
├── vite.config.js          ← Config de Vite
├── vercel.json             ← Config de deploy en Vercel
├── .env.example            ← Template de variables de entorno
├── .gitignore              ← Archivos ignorados por Git
├── supabase-schema.sql     ← SQL completo para crear las tablas
├── public/
│   └── favicon.svg         ← Ícono del sitio
└── src/
    ├── main.jsx            ← Punto de entrada
    ├── App.jsx             ← Toda la interfaz
    ├── supabaseClient.js   ← Conexión a Supabase
    └── useSupabase.js      ← Hook con todas las operaciones CRUD
```

## Tablas en Supabase

| Tabla           | Descripción                              |
|-----------------|------------------------------------------|
| `brands`        | Marcas registradas (SEIKO, TISSOT, etc.) |
| `trackings`     | Seguimientos de precios (módulo principal)|
| `price_history` | Historial de revisiones de precio        |
| `vendors`       | Vendedores/proveedores monitoreados      |

## Funciones automáticas (Supabase)

- **IDs automáticos:** SEG-001, SEG-002... y H-001, H-002...
- **Semana/Mes/Trimestre:** se calculan automáticamente al insertar
- **Estado del registro:** se valida automáticamente (Incompleto si falta marca/modelo/precio)
- **Timestamps:** created_at y updated_at se gestionan automáticamente

---

## Solución de problemas

### "Error de conexión" al abrir la app
→ Verifica que las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén bien configuradas en Vercel (Settings → Environment Variables)

### No se ven datos
→ Verifica que ejecutaste el SQL completo en Supabase SQL Editor. La sección de "DATOS DEMO" al final del SQL es opcional.

### Cambios en el código no se reflejan
→ Haz push a GitHub (`git add . && git commit -m "cambios" && git push`) y Vercel re-desplegará automáticamente.
