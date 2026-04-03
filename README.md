
# TelSplit Bot

Bot de Telegram para gestionar gastos compartidos en grupos (estilo Splitwise), desarrollado con Node.js, Telegraf y MongoDB.

## Comandos principales

✨ **Comandos principales:**
- **/gasto** `<monto> <descripcion> [@usuario]`  —  Añade un gasto. Si mencionas a alguien, esa persona paga.
- **/cuentas**  —  Muestra el balance y cómo saldar las deudas.
- **/limpiar**  —  Borra todos los gastos del chat o cuenta activa.


👥 **Cuentas compartidas:**
- **/nueva_cuenta**  —  Crea una cuenta/grupo para llevar gastos entre varias personas.
- **/invitar_cuenta**  —  Genera un enlace/token para invitar a otros a tu cuenta.
- **/unir_cuenta**  —  Únete a una cuenta usando el token de invitación.
- **/seleccionar_cuenta**  —  Cambia tu cuenta activa para registrar y ver gastos. Si no pasas argumentos, verás un menú con tus cuentas disponibles para elegir con un botón.
- **/cuenta_activa**  —  Muestra información de tu cuenta activa actual.
- **/mis_cuentas**  —  Lista las cuentas a las que perteneces.
- **/listar_cuentas**  —  (admin) Lista todas las cuentas existentes.

💡 _Puedes usar cuentas para separar gastos por grupo, piso compartido, viaje, etc._
Si no usas cuentas, todo funciona como antes: los gastos se guardan por chat.


## Requisitos

- Node.js 18+
- MongoDB Atlas (o MongoDB accesible)
- Token de bot de Telegram

## Instalacion local

1. Instala dependencias:

```bash
npm install
```


2. Crea tu archivo `.env` y completa los valores:

```env
BOT_TOKEN=tu_token_de_telegram
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/telsplit?retryWrites=true&w=majority
# Opcional: para comandos restringidos como /listar_cuentas
ADMIN_ID=123456789
```

3. Ejecuta en desarrollo:

```bash
npm run dev
```

4. Ejecuta en produccion:

```bash
npm start
```

## Estructura

```text
src/
  commands/
    gasto.js
    cuentas.js
    limpiar.js
  config/
    env.js
  db/
    mongoose.js
  models/
    Expense.js
    Participant.js
  services/
    expenseParser.js
    participants.js
    settlement.js
  utils/
    format.js
    user.js
  bot.js
  index.js
```

## Configurar MongoDB Atlas

1. Crea un cluster en MongoDB Atlas.
2. Crea un usuario de base de datos con permisos de lectura/escritura.
3. En Network Access, agrega una IP permitida:
   - Para pruebas: `0.0.0.0/0`.
   - Para produccion: limita a IPs de Render cuando sea posible.
4. Copia la cadena de conexion `mongodb+srv://...`.
5. Reemplaza `<password>` y el nombre de base de datos (por ejemplo, `telsplit`).
6. Guarda el valor final en `MONGO_URI`.

## Desplegar en Render.com

1. Sube el proyecto a GitHub.
2. En Render, crea un nuevo servicio:
   - New + -> Web Service
   - Conecta tu repositorio
3. Configura el servicio:
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. En Environment Variables agrega:
   - `BOT_TOKEN`
   - `MONGO_URI`
5. Crea el servicio y espera el deploy.
6. Revisa logs en Render para confirmar:
   - `MongoDB connected`
   - `Bot is running`


## Notas de uso en grupos y cuentas

- El reparto en `/cuentas` considera participantes que han interactuado con el bot en el chat o cuenta activa.
- Puedes crear varias cuentas para separar gastos por grupo, piso, viaje, etc.
- Si no seleccionas cuenta, los gastos se guardan por chat como antes.


## Manejo de errores

- Inputs inválidos en `/gasto` devuelven mensajes de ayuda.
- Errores de base de datos o Telegram se registran por consola y responden con mensaje amigable.
