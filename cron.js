import cron from "node-cron";
import dotenv from "dotenv"
dotenv.config({ path: '.env.local' });

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

cron.schedule("*/10 * * * * *", async () => {
  console.log(`⏰ Running cleanup at ${new Date().toISOString()}`);
  try {
    const res = await fetch(`${APP_URL}/api/cleanup`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const text = await res.text();
    console.log("Cleanup Response:", text);
  } catch (err) {
    console.error("Error:", err.message);
  }
});
