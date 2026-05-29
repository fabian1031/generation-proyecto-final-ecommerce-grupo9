# 📋 Checklist de Integración Backend Coroto

## ✅ Servicios Actualizados

### services/api.js
- [x] URL base cambiada a `https://coroto-backend.onrender.com`
- [x] JWT token agregado a headers automáticamente
- [x] Token obtenido de localStorage con clave `authToken`

### services/auth.service.js
- [x] Método `setUser(user, token)` agregado
- [x] Método `getToken()` agregado
- [x] Campo `rol` actualizado en lugar de `role`
- [x] Token almacenado en localStorage
- [x] Métodos de logout limpian ambas claves de almacenamiento

### services/product.service.js
- [x] Endpoints cambiados de `/products` a `/productos`
- [x] Parámetro de categoría: `category` → `categoria`
- [x] Método `patch()` removido

### services/users.services.js
- [x] Endpoints cambiados de `/users` a `/usuarios`
- [x] Métodos `getByEmail()` y `getByRole()` removidos
- [x] Método `patch()` removido

### services/orden.service.js (NUEVO)
- [x] Servicio creado
- [x] Métodos para órdenes (CRUD)
- [x] Métodos para detalles de órdenes (CRUD)

---

## ✅ Scripts Actualizados

### scripts/login.js
- [x] Importación de `userService` removida
- [x] Importación de `api` y `authService` agregada
- [x] Lógica cambiadaa usar `api.post('/auth/login')`
- [x] Respuesta manejada para extraer token y usuario
- [x] Token guardado con `authService.setUser()`

### scripts/register.js
- [x] Importación de `userService` removida
- [x] Importación de `api` agregada
- [x] Endpoint cambiadoa `/auth/register`
- [x] Estructura de datos actualizada según `RegisterRequestDTO`
- [x] Campos ajustados: nombre, apellido, tipoDocumento, numeroDocumento

### scripts/checkout.js
- [x] Importación de `ordenService` agregada
- [x] Función `fillCheckoutForm()` actualizada
- [x] Campos de usuario ajustados: nombre, apellido
- [x] Lógica de creación de orden implementada
- [x] Creación de items de orden implementada
- [x] Carrito vaciado después de compra exitosa
- [x] Redireccionamiento a página de éxito

### scripts/admin_dashboard.js
- [x] Campos actualizados: name→nombre, price→precio, stock→cantidad, category→categoria
- [x] Campo `isActive` cambiadoa `activo`
- [x] Método `patch()` cambiadoa `update()`
- [x] Función `buildProduct()` actualizada
- [x] Función `saveProduct()` usa `update()` en lugar de `patch()`
- [x] Funciones `deleteProduct()` y `restoreProduct()` actualizadas
- [x] Campo `imageUrl` manejado correctamente

### scripts/admin_users.js
- [x] Campos actualizados: username→nombre, lastname→apellido, role→rol
- [x] Campo `isActive` cambiadoa `activo`
- [x] Método `patch()` cambiadoa `update()`
- [x] Funciones `deleteUser()` y `restoreUser()` actualizadas
- [x] Función `fillForm()` actualizada

---

## 📄 Documentación Creada

- [x] **CAMBIOS_BACKEND.md** - Listado completo de cambios
- [x] **GUIA_USO_BACKEND.md** - Guía de uso para desarrolladores
- [x] **CHECKLIST_INTEGRACION.md** - Este archivo

---

## 🔄 Flujos Validados

### Autenticación
```
Usuario → /pages/register.html → POST /auth/register → Login → /pages/index.html
Usuario → /pages/login.html → POST /auth/login → Token guardado → /pages/index.html
```

### Productos
```
GET /productos → Mostrar en catálogo
Admin: CRUD /productos
```

### Órdenes
```
Usuario en carrito → /pages/checkout.html → POST /pedidos → POST /detalle_pedido (items)
```

---

## ⚡ Cambios Importantes a Recordar

1. **JWT Token**: Se envía automáticamente en todos los requests
2. **Campos de Usuario**: Ahora son `nombre`, `apellido`, `rol`, no `username`, `lastname`, `role`
3. **Campos de Producto**: Ahora son `nombre`, `precio`, `cantidad`, `categoria`, `imageUrl`
4. **Sin Patch**: El backend solo soporta PUT (actualización completa), no PATCH
5. **Órdenes**: Deben tener usuario autenticado y incluir items por separado

---

## 🧪 Próximos Pasos de Testing

### Fase 1: Autenticación
- [ ] Registrar usuario nuevo
- [ ] Verificar que contraseña cumple validaciones
- [ ] Login con credenciales correctas
- [ ] Login con credenciales incorrectas (debe fallar)
- [ ] Logout correctamente borra token

### Fase 2: Productos
- [ ] Ver listado de productos
- [ ] Filtrar por categoría
- [ ] Ver detalle de producto
- [ ] Agregar a carrito
- [ ] Admin puede crear producto

### Fase 3: Órdenes
- [ ] Usuario autenticado puede crear orden
- [ ] Items se crean correctamente
- [ ] Carrito se vacía
- [ ] Se redirige a página de éxito

### Fase 4: Admin
- [ ] Admin puede ver todos los usuarios
- [ ] Admin puede ver todos los productos
- [ ] Admin puede editar producto
- [ ] Admin puede desactivar/activar usuario

---

## 🔗 Enlaces Útiles

- **Backend API**: https://coroto-backend.onrender.com
- **Cambios Realizados**: Ver CAMBIOS_BACKEND.md
- **Guía de Uso**: Ver GUIA_USO_BACKEND.md

---

**Última actualización**: 29/05/2024
**Estado**: ✅ Integración completada
