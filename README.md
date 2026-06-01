# generation-proyecto-final-ecommerce-grupo9

## Backend (Render)

La API está desplegada en:

**https://coroto-backend.onrender.com**

El front la consume desde `services/api.js` (productos, auth, usuarios, órdenes, etc.). No hace falta json-server ni backend local.

> En el plan free de Render el servicio puede tardar unos segundos en despertar; si ves error 403 o timeout, espera y recarga.

## Asistente de compras (CoroTIA)

El chat usa `api/chat.php` con Gemini. Crea un `.env` a partir de `.env.example`:

```bash
GEMINI_API_KEY=tu_clave_de_google_ai_studio
API_BASE_URL=https://coroto-backend.onrender.com
```

El catálogo del asistente se obtiene de la misma API de Render (`/productos`).

### Chat con Live Server (puerto 5500)

Live Server **no ejecuta PHP**; el POST a `chat.php` devuelve 405. Los productos sí cargan (van a Render), pero el chat necesita PHP, por ende debe ejecutarse en coroto.online, o que la máquina local que está ejecutando ejecute PHP necesario para el Chat

```bash
# Terminal aparte (dejar corriendo)
php -S 127.0.0.1:8080 -t .
```

Con Live Server en `:5500`, el front envía el chat a `http://127.0.0.1:8080/api/chat.php` automáticamente.

En producción, el hosting del sitio debe soportar PHP, o define la URL en `index.html`:



## Integrantes

- Camilo Castellanos
- Hernan Vasquez
- Cristian Ceballos
- Fabian Beltran
