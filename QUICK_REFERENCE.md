# 🚀 Quick Reference - Backend Coroto

## Base URL
```
https://coroto-backend.onrender.com
```

## 🔑 Autenticación
```javascript
// Login
POST /auth/login
{
  email: string,
  password: string
}
Response: { token: string, usuario: {...} }

// Register
POST /auth/register
{
  nombre: string,
  apellido: string,
  email: string,
  password: string,
  tipoDocumento: "CC" | "PASAPORTE",
  numeroDocumento: string
}

// Token storage
localStorage.authToken = token
localStorage.authUser = JSON.stringify(user)
```

## 📦 Productos
```javascript
// Listar
GET /productos

// Obtener
GET /productos/{id}

// Crear
POST /productos
{
  nombre: string,
  categoria: enum,
  precio: number,
  cantidad: number,
  descripcion: string,
  imageUrl: string,
  activo: boolean
}

// Actualizar
PUT /productos/{id}

// Eliminar
DELETE /productos/{id}
```

## 👥 Usuarios
```javascript
// Listar
GET /usuarios

// Obtener
GET /usuarios/{id}

// Crear
POST /usuarios
{
  nombre: string,
  apellido: string,
  email: string,
  tipoDocumento: string,
  numeroDocumento: string
}

// Actualizar
PUT /usuarios/{id}

// Eliminar
DELETE /usuarios/{id}
```

## 🛒 Órdenes
```javascript
// Listar
GET /pedidos

// Obtener
GET /pedidos/{id}

// Crear
POST /pedidos
{
  fechaPedido: ISO datetime,
  estadoPago: "NO_PAGO" | "EN_PROCESO" | "APROBADO" | "DECLINADO",
  estado: "PENDIENTE" | "PROCESANDO" | "CANCELADA" | "ENVIADA",
  direccionEnvio: string,
  ciudadEnvio: string,
  usuarioId: number
}

// Actualizar
PUT /pedidos/{id}

// Eliminar
DELETE /pedidos/{id}
```

## 📋 Items de Órdenes
```javascript
// Listar
GET /detalle_pedido

// Obtener
GET /detalle_pedido/{id}

// Crear
POST /detalle_pedido
{
  ordenId: number,
  productoId: number,
  cantidad: number,
  precioUnitario: number
}

// Actualizar
PUT /detalle_pedido/{id}

// Eliminar
DELETE /detalle_pedido/{id}
```

## 📝 Categorías de Productos
```
LAPTOPS
PROCESADORES
TARJETAS_VIDEO
MEMORIAS_RAM
MONITORES
MOTHERBOARDS
PERIFERICOS
CASES
```

## 🔒 Validaciones
```javascript
// Contraseña
Pattern: ^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{6,}$
Min: 6 chars
Max: 100 chars
Requerido: 1 número, 1 minúscula, 1 mayúscula

// Nombre/Apellido
Min: 2 chars
Max: 50 chars

// Email
Formato válido requerido
Max: 100 chars

// Tipo de Documento
CC o PASAPORTE

// Número de Documento
Min: 5 chars
Max: 20 chars
```

## 💾 LocalStorage Keys
```javascript
authToken     // JWT token
authUser      // User data
// Otros (según la app)
cart          // Items en carrito
corotoOrder   // Orden actual
```

## ⚠️ Error Codes
```
400 - Bad Request (validación fallida)
401 - Unauthorized (sin autenticación)
403 - Forbidden (sin permisos)
404 - Not Found (recurso no existe)
422 - Unprocessable Entity (error de validación)
500 - Server Error
```

## 🛠️ Servicios Disponibles
```javascript
import { productService } from './services/product.service.js'
import { userService } from './services/users.services.js'
import { ordenService } from './services/orden.service.js'
import { authService } from './services/auth.service.js'
import { api } from './services/api.js'
```

## 🔄 Flujo Típico
```javascript
// 1. Autenticarse
const login = await api.post('/auth/login', {email, password})
authService.setUser(login.usuario, login.token)

// 2. Obtener datos
const productos = await productService.getAll()

// 3. Crear orden
const orden = await ordenService.create({...})
for (let item of carrito) {
  await ordenService.createItem({ordenId: orden.id, ...item})
}

// 4. Logout
authService.logout()
```

## 📱 Field Name Mappings
```
Antiguo          → Nuevo
username         → nombre
lastname         → apellido
role             → rol
isActive         → activo
name             → nombre
price            → precio
stock            → cantidad
image            → imageUrl
category         → categoria
```

---

**Última actualización**: 29/05/2024
