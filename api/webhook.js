export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
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
