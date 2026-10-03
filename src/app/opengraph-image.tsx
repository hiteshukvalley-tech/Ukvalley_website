import { ImageResponse } from "next/og";

// Link preview (WhatsApp, LinkedIn, Slack…): company logo mark + name.
export const alt = "Ukvalley Technologies";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f8f7ff 0%, #e6e3ff 100%)",
          color: "#151122",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 220,
            height: 220,
            borderRadius: 56,
            background: "linear-gradient(135deg, #3100ff, #684dff)",
            color: "#ffffff",
            fontSize: 150,
            fontWeight: 700,
          }}
        >
          U
        </div>
        <div style={{ display: "flex", marginTop: 48, fontSize: 84, fontWeight: 700 }}>Ukvalley</div>
        <div style={{ display: "flex", marginTop: 8, fontSize: 40, color: "#5b5680" }}>Technologies</div>
      </div>
    ),
    size,
  );
}
