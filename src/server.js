const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");

dotenv.config();
connectDB();

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://car-dealer-platform-swart.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman / server calls

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// ✅ THIS IS ENOUGH — DO NOT ADD app.options
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// static uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads"))
);

// routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/cars", require("./routes/car.routes"));
app.use("/api/inquiries", require("./routes/inquiry.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

// health
app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
