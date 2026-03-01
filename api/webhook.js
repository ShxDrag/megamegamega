import { activeTokens } from "./token.js";

let rateLimit = new Map();

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const token = req.headers["x-token"];
    const license = req.headers["x-license"];

    // 🔐 Token check
    if (!activeTokens.has(token)) {
        return res.status(401).json({ error: "Invalid token" });
    }

    if (Date.now() > activeTokens.get(token)) {
        activeTokens.delete(token);
        return res.status(401).json({ error: "Token expired" });
    }

    activeTokens.delete(token);

    // 🔑 License check
    if (license !== process.env.MASTER_LICENSE) {
        return res.status(403).json({ error: "Invalid license" });
    }

    // 🚫 Rate limit (1 request every 5 seconds per license)
    const lastRequest = rateLimit.get(license) || 0;
    if (Date.now() - lastRequest < 5000) {
        return res.status(429).json({ error: "Too many requests" });
    }

    rateLimit.set(license, Date.now());

    // 📩 Send to real webhook
    await fetch(process.env.WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
    });

    return res.status(200).json({ success: true });
}
