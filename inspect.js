module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, mimeType, product, country } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: "No packaging image supplied" });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // Keep the page usable even before an API key is configured.
    if (!apiKey) {
      return res.status(200).json({
        mode: "demo",
        inspection: {
          packaging_type: "Packaging appearance detected",
          likely_material: "Unverified from photo",
          material_confidence: "low",
          food_contact_likelihood: "cannot establish from photo",
          visible_text: [],
          visible_symbols: [],
          possible_issues: [
            "Exact material composition cannot be verified from appearance.",
            "Legal conformity and migration compliance cannot be established from a photograph."
          ],
          missing_information: [
            "Material specification",
            "Packaging weight",
            "Supplier Declaration of Compliance where applicable"
          ],
          cannot_determine: [
            "Polymer/layer composition",
            "Migration compliance",
            "Recyclability classification"
          ],
          confidence: "low"
        }
      });
    }

    const dataUrl = `data:${mimeType || "image/jpeg"};base64,${image}`;
    const model = process.env.OPENAI_MODEL || "gpt-5";

    const prompt = `You are PackComply's preliminary AI packaging-vision assistant.

Product: ${product || "unknown"}
Destination market: ${country || "unknown"}

Inspect ONLY the visible evidence in the packaging image.

Return valid JSON only with exactly these keys:
packaging_type
likely_material
material_confidence
food_contact_likelihood
visible_text
visible_symbols
possible_issues
missing_information
cannot_determine
confidence

Rules:
- Do not claim legal compliance or non-compliance.
- Do not infer an exact polymer, multilayer structure, chemical composition, migration compliance, certificate validity, recyclability classification, or legal responsibility from appearance alone.
- Distinguish visible evidence from assumptions.
- visible_text, visible_symbols, possible_issues, missing_information and cannot_determine must be arrays of concise strings.
- confidence and material_confidence should be "high", "medium", or "low".
- food_contact_likelihood should be "likely", "unlikely", or "cannot establish from photo".`;

    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: dataUrl }
          ]
        }]
      })
    });

    const raw = await upstream.text();

    if (!upstream.ok) {
      let detail = raw;
      try {
        const parsed = JSON.parse(raw);
        detail = parsed.error?.message || raw;
      } catch (_) {}
      return res.status(502).json({
        error: `AI service error: ${detail}`
      });
    }

    const response = JSON.parse(raw);
    const text = response.output_text || "";
    let inspection;

    try {
      inspection = JSON.parse(text);
    } catch (_) {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI returned an unreadable result.");
      inspection = JSON.parse(match[0]);
    }

    return res.status(200).json({ mode: "live", inspection });
  } catch (error) {
    console.error("PackComply AI inspection error:", error);
    return res.status(500).json({
      error: "The AI inspection function failed. Check the Vercel Function Logs and OPENAI_API_KEY."
    });
  }
};
