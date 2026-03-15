const rateLimit = new Map();

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Rate limiting
    const ip = (req.headers['x-forwarded-for']?.split(',')[0].trim()) || req.socket.remoteAddress;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 2;

    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, []);
    }

    const requests = rateLimit.get(ip).filter(time => now - time < windowMs);
    requests.push(now);
    rateLimit.set(ip, requests);

    // Prevent memory leak
    for (const [key, times] of rateLimit.entries()) {
        if (times.every(time => now - time >= windowMs)) {
            rateLimit.delete(key);
        }
    }

    if (requests.length >= maxRequests) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({ error: "Too many requests, slow down." });
    }

    const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

    if (!DISCORD_WEBHOOK) {
        return res.status(500).json({ error: "Webhook URL not configured" });
    }

    // Sanitize body - block @everyone/@here and blind forwarding
    const { content, username, avatar_url } = req.body;
    const sanitized = (content || "")
        .replace(/@everyone/gi, "@\u200beveryone")
        .replace(/@here/gi, "@\u200bhere")
        .slice(0, 2000);

    const payload = {
        content: sanitized,
        allowed_mentions: { parse: [] },
    };

    if (username) payload.username = String(username).slice(0, 80);
    if (avatar_url) payload.avatar_url = String(avatar_url);

    try {
        const response = await fetch(DISCORD_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const text = await response.text();
        res.status(response.status).send(text);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
