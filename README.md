# generation-proyecto-final-ecommerce-grupo9

## Probar proyecto

Para testear el proyecto es necesario iniciar json-server. Esto debido a que no esta construído el backend actualmente. La solución propuesta es usar json-server para mockearlo mientras tenemos un backend funcional para conectar.

Modo de uso:

```bash
# usar este comando para iniciar json-server

npm i
npx json-server ./development/db.json

```

### Asistente de compras (chatbot)

El asistente flotante usa Gemini vía PHP. Necesitas **dos procesos** en desarrollo:

```bash
# 1) API de productos (json-server)
npx json-server ./development/db.json

# 2) Api key de Gemini
.env.example 
```


El asistente recomienda productos según presupuesto y, si el usuario confirma, agrega artículos al carrito en `localStorage`.

### Integrantes

- Camilo Castellanos
- Hernan Vasquez
- Cristian Ceballos
- Fabian Beltran
- Mario Alberto Buen dia