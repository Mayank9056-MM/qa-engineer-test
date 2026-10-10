import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import tableOrderRoutes from "./routes/table-order.routes.js";
import einvoiceRoutes from "./routes/einvoice.routes.js";
import { initDatabase } from "./db/database.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

initDatabase();

io.on("connection", (socket) => {
  console.log("📱 Client connected:", socket.id);

  socket.on("join_merchant", (merchantId) => {
    socket.join(`merchant_${merchantId}`);
    console.log(`Merchant ${merchantId} joined room`);
  });

  socket.on("join_table", (tableNumber) => {
    socket.join(`table_${tableNumber}`);
    console.log(`Joined table ${tableNumber} room`);
  });

  socket.on("disconnect", () => {
    console.log("📱 Client disconnected:", socket.id);
  });
});

app.set("io", io);

app.get("/", (req, res) => {
  res.json({
    message: "EU Pay QA Test API",
    version: "1.0.0",
    features: [
      "🔐 Authentication (JWT)",
      "💳 Payment Processing",
      "🪝 Webhook Handling",
      "🍽️ Table Orders (Socket.IO)",
      "📄 E-Invoicing",
    ],
    endpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/payments",
      "POST /api/payments",
      "GET /api/payments/:id",
      "POST /api/webhooks/payment-status",
      "POST /api/webhooks/e-invoice",
      "GET /api/table-orders",
      "POST /api/table-orders",
      "PATCH /api/table-orders/:id/status",
      "POST /api/einvoice/submit",
      "GET /api/einvoice/status/:invoice_id",
    ],
    socket_events: [
      "join_merchant",
      "join_table",
      "new_order",
      "order_status_changed",
    ],
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/table-orders", tableOrderRoutes);
app.use("/api/einvoice", einvoiceRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

export { app, httpServer };
export default app;