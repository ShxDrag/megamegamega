const rateLimit = new Map();

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Rate limiting
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 5;

    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, []);
    }

    const requests = rateLimit.get(ip).filter(time => now - time < windowMs);
    requests.push(now);
    rateLimit.set(ip, requests);

    if (requests.length > maxRequests) {
        return res.status(429).json({ error: "Too many requests, slow down." });
    }

    const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

    if (!DISCORD_WEBHOOK) {
        return res.status(500).json({ error: "Webhook URL not configured" });
    }

    try {
        const response = await fetch(DISCORD_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        });

        const text = await response.text();
        res.status(response.status).send(text);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
