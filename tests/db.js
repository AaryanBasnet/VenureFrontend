// Direct access to the LOCAL test database, for set-up that cannot go through the UI (a paid deposit needs eSewa).
// It refuses to connect to anything that is not a local MongoDB, so it can never touch a remote database.
import { createRequire } from "node:module";

export const LOCAL_DB_URL = process.env.E2E_MONGO_URL || "mongodb://127.0.0.1:27017/venure-local-e2e";

let driver = null;
try {
  // The driver ships with the backend's dependencies; the frontend does not install it.
  driver = createRequire(import.meta.url)(process.env.E2E_BACKEND_DIR ? `${process.env.E2E_BACKEND_DIR}/node_modules/mongodb` : "../../VenureBackend/node_modules/mongodb");
} catch {
  driver = null;
}

export const dbAvailable = Boolean(driver) && /^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(LOCAL_DB_URL);

export async function openDb() {
  if (!dbAvailable) throw new Error("The local test database is not reachable from the tests");
  const client = new driver.MongoClient(LOCAL_DB_URL);
  await client.connect();
  const db = client.db();
  return { db, ObjectId: driver.ObjectId, close: () => client.close() };
}

// Runs a function with an open database and always closes it.
export async function withDb(fn) {
  const handle = await openDb();
  try {
    return await fn(handle);
  } finally {
    await handle.close();
  }
}

// Creates a customer straight in the local database. Registration is rate limited per IP (5 an hour), so specs that
// need a second customer insert one instead of registering.
export async function insertCustomer({ name, email, password, phone = "9811111111" }) {
  const bcrypt = createRequire(import.meta.url)(process.env.E2E_BACKEND_DIR ? `${process.env.E2E_BACKEND_DIR}/node_modules/bcryptjs` : "../../VenureBackend/node_modules/bcryptjs");
  const hash = await bcrypt.hash(password, 10);
  return withDb(async ({ db }) => {
    const res = await db.collection("users").insertOne({ name, email, password: hash, phone, role: "Customer", avatar: "", favorites: [], isDeleted: false, createdAt: new Date(), __v: 0 });
    return String(res.insertedId);
  });
}
