let activeTokens = new Map();

export default function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const token = Math.random().toString(36).substring(2);
    const expire = Date.now() + 30000;

    activeTokens.set(token, expire);

    return res.status(200).json({ token });
}

export { activeTokens };
