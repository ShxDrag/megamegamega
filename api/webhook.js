let lastRequest = 0;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // 🚫 Simple rate limit (2 seconds)
    if (Date.now() - lastRequest < 2000) {
        return res.status(429).json({ error: "Too many requests" });
    }

    lastRequest = Date.now();

    try {
        await fetch(process.env.WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body)
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: "Failed to send webhook" });
    }
}
