---
layout: get_started
title: Get Started
description: Get started with Unshared Labs
image: assets/images/pic11.jpg
nav-menu: true
---

<!-- Developer Guide / SDK Installation -->
  <section id="developer-guide" style="margin-top:5rem; padding:2rem; border-top:1px solid #ddd;">
    <h2 style="font-weight:normal; margin-bottom:1rem;">Developer Guide: SDK Installation</h2>
    <p style="color:#fff; margin-bottom:1rem;">
      A lightweight, drop-in SDK for sending secure session and event data to the Unshared Labs platform. Designed for server environments like Express, Fastify, or Next.js API routes.
    </p>

    <h3 style="font-weight:normal;">Installation</h3>
    <pre style="background:#f5f5f5; padding:1rem; border-radius:6px; overflow-x:auto; color: #000;">
npm install unshared-clientjs-sdk
# or
yarn add unshared-clientjs-sdk
    </pre>

    <h3 style="font-weight:normal;">Quick Example</h3>
    <pre style="background:#f5f5f5; padding:1rem; border-radius:6px; overflow-x:auto; color: #000;">
import UnsharedLabsClient from "unshared-clientjs-sdk";

const client = new UnsharedLabsClient({
  apiKey: process.env.UNSHARED_LABS_API_KEY!,
});
    </pre>

    <h3 style="font-weight:normal;">API: submitEvent</h3>
    <p style="color:#555;">
      Sends events to the Unshared Labs platform.
    </p>
    <pre style="background:#f5f5f5; padding:1rem; border-radius:6px; overflow-x:auto; color: #000;">
submitEvent(
  eventType: string,
  userId: string,
  ipAddress: string,
  deviceId: string,
  sessionHash: string,
  userAgent: string,
  clientTimestamp: string,
  eventDetails?: map&lt;String,any&gt; | null
): Promise&lt;any&gt;
    </pre>

    <h3 style="font-weight:normal;">Example: Express Server</h3>
    <pre style="background:#f5f5f5; padding:1rem; border-radius:6px; overflow-x:auto; color: #000;">
import express from "express";
import UnsharedLabsClient from "unshared-clientjs-sdk";

const app = express();
app.use(express.json());

const client = new UnsharedLabsClient({
  apiKey: process.env.UNSHARED_LABS_API_KEY!,
});

app.post("/login", async (req, res) =&gt; {
  const { userId } = req.body;

  try {
    await client.submitEvent(
      "login",
      userId,
      req.ip,
      req.headers["x-device-id"]?.toString() || "unknown-device",
      req.headers["x-session-hash"]?.toString() || "unknown-session",
      req.headers["user-agent"] || "",
      new Date().toISOString(),
      new Map(Object.entries({"example": true, "source": 'test-server' }))
    );

    res.status(200).json({ message: "Login tracked" });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

app.listen(3000, () =&gt; console.log("Server running on port 3000"));
    </pre>
  </section>
