const axios = require("axios");

class BolnaService {
  constructor() {
    this.baseURL = "https://api.bolna.dev";
    this.apiKey = process.env.BOLNA_API_KEY;

    console.log("Bolna Service initialized:");
    console.log("- API Key exists:", !!this.apiKey);
    console.log(
      "- API Key (first 10 chars):",
      this.apiKey ? this.apiKey.substring(0, 10) + "..." : "undefined"
    );

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  // ======================================================
  // CREATE AGENT (Bolna v2 API)
  // ======================================================
  async callCreateAssistantAPI(payload) {
    try {
      console.log("🔥 Sending Bolna Agent Payload:");
      console.dir(payload, { depth: 10 });

      // v2 API endpoint and agent_config payload
      const response = await this.axiosInstance.post(
        "/v2/agent",
        { agent_config: payload },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Bolna Agent Created:", response.data);

      return {
        success: true,
        data: response.data,
        message: "Agent created successfully in Bolna",
      };
    } catch (error) {
      console.error(
        "❌ Bolna Create Error:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error: error.response?.data?.detail || error.message,
        details: error.response?.data,
      };
    }
  }

  // ======================================================
  // GET ASSISTANT
  // ======================================================
  async callGetAssistantAPI(assistantId) {
    try {
      const response = await this.axiosInstance.get(`/assistants/${assistantId}`);
      return {
        success: true,
        data: response.data,
        message: "Assistant retrieved successfully",
      };
    } catch (error) {
      console.error(
        "Bolna callGetAssistantAPI error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data || error.message,
        message: "Failed to get assistant",
      };
    }
  }

  // ======================================================
  // UPDATE ASSISTANT
  // ======================================================
  async callUpdateAssistantAPI(assistantId, updateData) {
    try {
      const response = await this.axiosInstance.patch(
        `/assistants/${assistantId}`,
        updateData
      );

      return {
        success: true,
        data: response.data,
        message: "Assistant updated successfully",
      };
    } catch (error) {
      console.error(
        "Bolna callUpdateAssistantAPI error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data || error.message,
        message: "Failed to update assistant",
      };
    }
  }

  // ======================================================
  // DELETE ASSISTANT
  // ======================================================
  async callDeleteAssistantAPI(assistantId) {
    try {
      const response = await this.axiosInstance.delete(
        `/assistants/${assistantId}`
      );

      return {
        success: true,
        data: response.data,
        message: "Assistant deleted successfully",
      };
    } catch (error) {
      console.error(
        "Bolna callDeleteAssistantAPI error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data || error.message,
        message: "Failed to delete assistant",
      };
    }
  }

  // ======================================================
  // CREATE CALL
  // ======================================================
  async callCreateCallAPI(callData) {
    try {
      const payload = {
        assistant_id: callData.assistantId,
        recipient_phone_number: callData.customer?.number,
        metadata: callData.metadata || {},
      };

      console.log("☎ Sending call payload:", JSON.stringify(payload, null, 2));

      const response = await this.axiosInstance.post("/calls", payload);

      return {
        success: true,
        data: response.data,
        message: "Call created successfully",
      };
    } catch (error) {
      console.error(
        "Bolna callCreateCallAPI error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data || error.message,
        message: "Failed to create call",
      };
    }
  }

  // ======================================================
  // GET CALL
  // ======================================================
  async callGetCallAPI(callId) {
    try {
      const response = await this.axiosInstance.get(`/calls/${callId}`);

      return {
        success: true,
        data: response.data,
        message: "Call retrieved successfully",
      };
    } catch (error) {
      console.error(
        "Bolna callGetCallAPI error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data || error.message,
        message: "Failed to get call",
      };
    }
  }

  // ======================================================
  // LIST CALLS
  // ======================================================
  async listCalls(limit = 10, offset = 0) {
    try {
      const response = await this.axiosInstance.get("/calls", {
        params: { limit, offset },
      });

      return {
        success: true,
        data: response.data,
        message: "Calls retrieved successfully",
      };
    } catch (error) {
      console.error(
        "Bolna listCalls error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data || error.message,
        message: "Failed to list calls",
      };
    }
  }

  // ======================================================
  // PUBLIC KEY
  // ======================================================
  getPublicKey() {
    return process.env.BOLNA_PUBLIC_KEY || null;
  }
}

module.exports = new BolnaService();
