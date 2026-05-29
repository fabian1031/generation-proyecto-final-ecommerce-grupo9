# 🚀 Guía de Configuración - Backend Coroto

## Descripción General
Este documento te guiará sobre cómo usar el proyecto actualizado con el backend de Coroto.

---

## ✅ Requisitos Previos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet
- Acceso al backend en: `https://coroto-backend.onrender.com`

---

## 🔑 Variables de Configuración

El proyecto está configurado para usar:
- **Base URL del API:** `https://coroto-backend.onrender.com`
- **Token de Autenticación:** Se almacena en `localStorage` con clave `authToken`
- **Datos de Usuario:** Se almacenan en `localStorage` con clave `authUser`

No es necesario cambiar nada en el código. La configuración ya está lista.

---

## 📱 Flujos de Uso

### 1. Registro de Usuario

**Página:** `/pages/register.html`

**Campos requeridos:**
- Nombre (2-50 caracteres)
- Apellido (2-50 caracteres)
- Email (formato válido)
- Contraseña (6-100 caracteres, debe incluir número, minúscula y mayúscula)
- Tipo de Documento (CC o PASAPORTE)
- Número de Documento (5-20 caracteres)

**Validaciones:**
- La contraseña debe cumplir el patrón: `^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{6,}$`
- El email debe ser único en el sistema

**Response exitoso:**
```javascript
{
  message: "Usuario registrado exitosamente"
}
```

### 2. Login de Usuario

**Página:** `/pages/login.html`

**Campos requeridos:**
- Email
- Contraseña

**Response exitoso:**
```javascript
{
  token: "JWT_TOKEN_HERE",
  usuario: {
    id: 1,
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan@example.com",
    tipoDocumento: "CC",
    numeroDocumento: "123456789",
    rol: "USER",
    activo: true
  }
}
```

**Lo que sucede:**
- Se guarda el token JWT en localStorage con clave `authToken`
- Se guardan los datos del usuario en localStorage con clave `authUser`
- Se redirige al usuario a `/pages/index.html`
- Todos los requests posteriores incluyen el token automáticamente

### 3. Compra y Creación de Órdenes

**Página:** `/pages/checkout.html`

**Pasos:**
1. Agregar productos al carrito
2. Ir a checkout
3. Si no estás logueado, iniciar sesión
4. Completar datos de envío:
   - Dirección de envío
   - Ciudad de envío
   - Datos personales (se pre-llenan si estás logueado)
5. Confirmar compra

**Response exitoso:**
Se crea una orden (Pedido) en el backend con:
```javascript
{
  id: 123,
  fechaPedido: "2024-05-29T10:30:00Z",
  estadoPago: "NO_PAGO",
  estado: "PENDIENTE",
  direccionEnvio: "Calle 123 #45-67",
  ciudadEnvio: "Bogotá",
  usuarioId: 1,
  usuarioNombre: "Juan",
  total: 150000
}
```

Y se crean items para cada producto:
```javascript
{
  id: 456,
  ordenId: 123,
  productoId: 5,
  productoNombre: "Laptop",
  cantidad: 1,
  precioUnitario: 150000
}
```

El carrito se vacía y se redirige a `/pages/success.html`

### 4. Dashboard de Admin (Gestión de Productos)

**Página:** `/pages/admin_dashboard.html`

**Funcionalidades:**
- Listar todos los productos
- Crear nuevo producto
- Editar producto existente
- Desactivar/Activar producto

**Campos de producto:**
- Nombre (requerido)
- Categoría: LAPTOPS, PROCESADORES, TARJETAS_VIDEO, MEMORIAS_RAM, MONITORES, MOTHERBOARDS, PERIFERICOS, CASES
- Descripción
- Precio (requerido, mayor a 0)
- Cantidad (stock disponible)
- URL de imagen

**Nota:** Este dashboard requiere autenticación.

### 5. Dashboard de Admin (Gestión de Usuarios)

**Página:** `/pages/admin_users.html`

**Funcionalidades:**
- Listar todos los usuarios
- Filtrar activos/inactivos
- Editar usuario
- Desactivar/Activar usuario

**Nota:** Este dashboard requiere autenticación.

---

## 🔐 Manejo de Autenticación

### Verificar si está autenticado:

```javascript
import { authService } from './services/auth.service.js';

if (authService.isAuthenticated()) {
  console.log('Usuario autenticado');
  const user = authService.getUser();
  console.log(user.nombre);
}
```

### Verificar si es admin:

```javascript
if (authService.isAdmin()) {
  console.log('Usuario es administrador');
}
```

### Logout:

```javascript
authService.logout();
window.location.href = '/pages/login.html';
```

---

## 🛒 Servicios Disponibles

### ProductService

```javascript
import { productService } from './services/product.service.js';

// Obtener todos los productos
const products = await productService.getAll();

// Obtener producto por ID
const product = await productService.getById(1);

// Filtrar por categoría
const laptops = await productService.getByCategory('LAPTOPS');

// Crear producto (requiere autenticación + permisos admin)
const newProduct = await productService.create({
  nombre: "Laptop",
  categoria: "LAPTOPS",
  precio: 1500000,
  cantidad: 10,
  descripcion: "Laptop gaming",
  imageUrl: "https://...",
  activo: true
});

// Actualizar producto
const updated = await productService.update(1, {
  ...product,
  precio: 1600000
});

// Eliminar producto
await productService.delete(1);
```

### UserService

```javascript
import { userService } from './services/users.services.js';

// Obtener todos los usuarios (solo admin)
const users = await userService.getAll();

// Obtener usuario por ID
const user = await userService.getById(1);

// Crear usuario
const newUser = await userService.create({
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@example.com",
  tipoDocumento: "CC",
  numeroDocumento: "123456789"
});

// Actualizar usuario
const updated = await userService.update(1, {
  nombre: "Juan Carlos",
  apellido: "Pérez García"
});

// Eliminar usuario
await userService.delete(1);
```

### OrdenService

```javascript
import { ordenService } from './services/orden.service.js';

// Obtener todas las órdenes (solo admin o usuario propio)
const orders = await ordenService.getAll();

// Obtener orden por ID
const order = await ordenService.getById(1);

// Crear orden
const newOrder = await ordenService.create({
  fechaPedido: new Date().toISOString(),
  estadoPago: "NO_PAGO",
  estado: "PENDIENTE",
  direccionEnvio: "Calle 123",
  ciudadEnvio: "Bogotá",
  usuarioId: 1
});

// Crear item de orden
const item = await ordenService.createItem({
  ordenId: 1,
  productoId: 5,
  cantidad: 2,
  precioUnitario: 50000
});
```

### AuthService

```javascript
import { authService } from './services/auth.service.js';

// Obtener usuario actual
const user = authService.getUser();

// Obtener token JWT
const token = authService.getToken();

// Verificar autenticación
const isAuth = authService.isAuthenticated();

// Verificar si es admin
const isAdmin = authService.isAdmin();

// Guardar sesión (después de login)
authService.setUser(user, token);

// Logout
authService.logout();
```

---

## ⚠️ Manejo de Errores

Todos los servicios pueden lanzar excepciones. Es recomendable usar try-catch:

```javascript
try {
  const products = await productService.getAll();
} catch (error) {
  console.error('Error:', error.message);
  // Mostrar mensaje al usuario
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: error.message || 'Error desconocido'
  });
}
```

---

## 🐛 Solución de Problemas

### "Error 401 - Unauthorized"
- El token JWT ha expirado o es inválido
- Solución: Hacer logout y login nuevamente

### "Error 403 - Forbidden"
- No tienes permisos para acceder a este recurso
- Solución: Verificar que tengas el rol correcto (admin)

### "Error 404 - Not Found"
- El recurso no existe
- Solución: Verificar el ID o que el recurso esté activo

### "Error 422 - Validation Error"
- Los datos no cumplen con las validaciones del backend
- Solución: Revisar los datos enviados contra la documentación

---

## 📚 Documentación Completa

Para más información sobre los endpoints disponibles, revisar:
- `CAMBIOS_BACKEND.md` - Listado de cambios realizados
- OpenAPI Specification del backend (proporcionada)

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12 → Console)
2. Verifica la sección "Network" para ver los requests
3. Confirma que tienes autenticación correcta
4. Revisa que los datos cumplan con las validaciones

---

**Última actualización:** 29/05/2024
**Versión del Backend:** v0
