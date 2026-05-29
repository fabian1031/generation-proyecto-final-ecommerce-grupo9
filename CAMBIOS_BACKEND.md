# Cambios Realizados - Integración Backend Coroto

## 📋 Resumen
Se han realizado cambios significativos para integrar el proyecto con el backend de Coroto en `https://coroto-backend.onrender.com`. A continuación se detallan todos los cambios realizados.

---

## 🔧 Cambios en Servicios

### 1. **services/api.js**
- ✅ Cambio de URL base: `http://localhost:3000` → `https://coroto-backend.onrender.com`
- ✅ Agregado soporte para JWT en headers
- ✅ El token se obtiene automáticamente del localStorage con clave `authToken`
- ✅ Se envía en todos los requests autenticados como `Authorization: Bearer {token}`

### 2. **services/auth.service.js**
- ✅ Nuevo método `setUser(user, token)` para almacenar usuario y token JWT
- ✅ Nuevo método `getToken()` para obtener el token
- ✅ Actualizado `isAdmin()` para usar `user?.rol === "ADMIN"` (según modelo backend)
- ✅ Removido método `login()` - reemplazado por `setUser()`
- ✅ Almacenamiento de token en localStorage con clave `authToken`

### 3. **services/product.service.js**
- ✅ Endpoints actualizados: `/products` → `/productos`
- ✅ Parámetro de categoría: `?category=` → `?categoria=`
- ✅ Removido método `patch()` (no soportado por backend)

### 4. **services/users.services.js**
- ✅ Endpoints actualizados: `/users` → `/usuarios`
- ✅ Removidos métodos `getByRole()` y `getByEmail()` (usar API directamente si es necesario)
- ✅ Removido método `patch()`

### 5. **services/orden.service.js** *(NUEVO)*
- ✅ Creado nuevo servicio para gestionar órdenes
- ✅ Métodos para órdenes:
  - `getAll()` - obtiene todas las órdenes
  - `getById(id)` - obtiene una orden específica
  - `create(orden)` - crea nueva orden
  - `update(id, orden)` - actualiza una orden
  - `delete(id)` - elimina una orden

- ✅ Métodos para detalles de órdenes:
  - `getAllItems()` - obtiene todos los detalles
  - `getItemById(id)` - obtiene un detalle
  - `createItem(item)` - crea un detalle
  - `updateItem(id, item)` - actualiza un detalle
  - `deleteItem(id)` - elimina un detalle

---

## 📝 Cambios en Scripts

### 1. **scripts/login.js**
- ✅ Removida importación de `userService`
- ✅ Agregada importación de `api` y `authService`
- ✅ Cambio de lógica: Ahora usa `api.post('/auth/login', {email, password})`
- ✅ Extrae usuario y token de la respuesta
- ✅ Usa `authService.setUser()` para guardar sesión con JWT

**Flujo de autenticación:**
```javascript
POST /auth/login
{
  email: string,
  password: string
}

Response:
{
  token: string (JWT),
  usuario: {
    id, nombre, apellido, email, tipoDocumento, numeroDocumento, rol, activo
  }
}
```

### 2. **scripts/register.js**
- ✅ Removida importación de `userService`
- ✅ Agregada importación de `api`
- ✅ Cambio de endpoint: Ahora usa `api.post('/auth/register')`
- ✅ Estructura de usuario ajustada según `RegisterRequestDTO`:

**Estructura esperada:**
```javascript
{
  nombre: string (2-50 chars),
  apellido: string (2-50 chars),
  email: string (email válido),
  password: string (6-100 chars, debe incluir: número, minúscula, mayúscula),
  tipoDocumento: string (CC o PASAPORTE),
  numeroDocumento: string (5-20 chars)
}
```

### 3. **scripts/checkout.js**
- ✅ Agregada importación de `ordenService`
- ✅ Cambio de flujo: Ahora crea órdenes en el backend
- ✅ Actualizado `fillCheckoutForm()` para usar campos del nuevo modelo:
  - `user.nombre` (antes: `user.username`)
  - `user.apellido` (antes: `user.lastname`)
- ✅ Nueva lógica de confirmación de compra:

**Flujo de creación de orden:**
1. Valida que usuario esté autenticado
2. Crea orden con `ordenService.create()`
3. Crea items de orden con `ordenService.createItem()` para cada producto
4. Limpia el carrito
5. Redirige a página de éxito

```javascript
POST /pedidos
{
  fechaPedido: ISO datetime,
  estadoPago: "NO_PAGO" | "EN_PROCESO" | "APROBADO" | "DECLINADO",
  estado: "PENDIENTE" | "PROCESANDO" | "CANCELADA" | "ENVIADA",
  direccionEnvio: string,
  ciudadEnvio: string,
  usuarioId: number
}

POST /detalle_pedido (para cada item)
{
  ordenId: number,
  productoId: number,
  cantidad: number (mínimo 1),
  precioUnitario: number
}
```

---

## 📊 Mapeo de Endpoints

### Autenticación
| Función | Endpoint Anterior | Endpoint Nuevo |
|---------|------------------|-----------------|
| Login | GET `/users?email=X` | POST `/auth/login` |
| Registro | POST `/users` | POST `/auth/register` |

### Productos
| Función | Endpoint Anterior | Endpoint Nuevo |
|---------|------------------|-----------------|
| Listar | GET `/products` | GET `/productos` |
| Obtener | GET `/products/{id}` | GET `/productos/{id}` |
| Crear | POST `/products` | POST `/productos` |
| Actualizar | PUT `/products/{id}` | PUT `/productos/{id}` |
| Eliminar | DELETE `/products/{id}` | DELETE `/productos/{id}` |

### Usuarios
| Función | Endpoint Anterior | Endpoint Nuevo |
|---------|------------------|-----------------|
| Listar | GET `/users` | GET `/usuarios` |
| Obtener | GET `/users/{id}` | GET `/usuarios/{id}` |
| Crear | POST `/users` | POST `/usuarios` |
| Actualizar | PUT `/users/{id}` | PUT `/usuarios/{id}` |
| Eliminar | DELETE `/users/{id}` | DELETE `/usuarios/{id}` |

### Órdenes (NUEVO)
| Función | Endpoint |
|---------|----------|
| Listar órdenes | GET `/pedidos` |
| Obtener orden | GET `/pedidos/{id}` |
| Crear orden | POST `/pedidos` |
| Actualizar orden | PUT `/pedidos/{id}` |
| Eliminar orden | DELETE `/pedidos/{id}` |

### Detalles de Órdenes (NUEVO)
| Función | Endpoint |
|---------|----------|
| Listar detalles | GET `/detalle_pedido` |
| Obtener detalle | GET `/detalle_pedido/{id}` |
| Crear detalle | POST `/detalle_pedido` |
| Actualizar detalle | PUT `/detalle_pedido/{id}` |
| Eliminar detalle | DELETE `/detalle_pedido/{id}` |

---

## 🔐 Autenticación JWT

### Cómo funciona:
1. **Login:** Usuario envía email y contraseña a `/auth/login`
2. **Token:** Backend retorna JWT en la respuesta
3. **Almacenamiento:** Token se guarda en `localStorage.authToken`
4. **Uso:** Cada request incluye `Authorization: Bearer {token}`
5. **Logout:** Se elimina el token del localStorage

### Verificación de autenticación:
```javascript
import { authService } from './services/auth.service.js';

// Verificar si está autenticado
if (authService.isAuthenticated()) {
  // Usuario está logueado
}

// Obtener usuario actual
const user = authService.getUser();

// Verificar si es admin
if (authService.isAdmin()) {
  // Usuario es admin
}

// Logout
authService.logout();
```

---

## ⚠️ Cosas Importantes

### 1. **Campos de Usuario**
El modelo de usuario del backend es diferente:
- `nombre` (no `username`)
- `apellido` (no `lastname`)
- `rol` (no `role`) - valores: "ADMIN", "USER"
- `tipoDocumento` y `numeroDocumento` requeridos en registro

### 2. **Categorías de Productos**
Las categorías son enumeradas en el backend:
```
LAPTOPS, PROCESADORES, TARJETAS_VIDEO, MEMORIAS_RAM, 
MONITORES, MOTHERBOARDS, PERIFERICOS, CASES
```

### 3. **Estado de Órdenes**
- **Estados de pago:** NO_PAGO, EN_PROCESO, APROBADO, DECLINADO
- **Estados de pedido:** PENDIENTE, PROCESANDO, CANCELADA, ENVIADA

### 4. **Validación de Contraseña**
La contraseña debe cumplir con:
- Mínimo 6 caracteres
- Máximo 100 caracteres
- Contener al menos: 1 número, 1 minúscula, 1 mayúscula
- Patrón: `^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{6,}$`

### 5. **Tipo de Documento**
Solo acepta: `CC` o `PASAPORTE`

---

## 🧪 Próximos Pasos

1. **Testing:** Probar flujos de autenticación (login/registro)
2. **Integración:** Verificar que los productos se carguen correctamente
3. **Checkout:** Completar flujo de creación de órdenes
4. **Admin:** Actualizar dashboard de administrador si es necesario
5. **Validaciones:** Revisar y ajustar validaciones según respuestas del backend

---

## 📦 Archivos Modificados

✅ `services/api.js`
✅ `services/auth.service.js`
✅ `services/product.service.js`
✅ `services/users.services.js`
✅ `services/orden.service.js` (NUEVO)
✅ `scripts/login.js`
✅ `scripts/register.js`
✅ `scripts/checkout.js`

---

## 🔗 Backend API Documentation
Base URL: `https://coroto-backend.onrender.com`

Todos los endpoints requieren autenticación JWT excepto:
- `POST /auth/register` - Registro de nuevo usuario
- `POST /auth/login` - Login de usuario

Para más detalles, revisar la especificación OpenAPI proporcionada.
