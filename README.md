# TelSplit Bot

Bot de Telegram para gestionar gastos compartidos en grupos (estilo Splitwise), desarrollado con Node.js, Telegraf y MongoDB.

## Funcionalidades

- `/gasto <monto> <descripcion> [@usuario]`
  - Registra un gasto.
  - Si no indicas `@usuario`, el pagador es quien envia el comando.
  - Si indicas `@usuario`, ese usuario se toma como pagador.
- `/cuentas`
  - Calcula total, cuota equitativa y balance por persona.
  - Muestra una liquidacion simplificada (quien paga a quien).
- `/limpiar`
  - Borra todos los gastos del chat actual.

## Requisitos

- Node.js 18+
- MongoDB Atlas (o MongoDB accesible)
- Token de bot de Telegram

## Instalacion local

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo `.env` a partir de `.env.example` y completa valores:

```env
BOT_TOKEN=tu_token_de_telegram
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/telsplit?retryWrites=true&w=majority
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

## Notas de uso en grupos

- El reparto en `/cuentas` considera participantes que han interactuado con el bot en el chat.
- Cada gasto persiste con:
  - `chatId`
  - `payerName`
  - `amount`
  - `description`
  - `date`

## Manejo de errores

- Inputs invalidos en `/gasto` devuelven mensajes de ayuda.
- Errores de base de datos o Telegram se registran por consola y responden con mensaje amigable.
