"use strict";
const { app } = require("@azure/functions");

app.http("healthCheck", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    return {
      body: JSON.stringify({ status: "ok", message: "Musici Belasting API is running" }),
      headers: { "Content-Type": "application/json" }
    };
  }
});
