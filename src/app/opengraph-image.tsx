import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Clínica Arca — Centro Odontológico";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #006194 0%, #007bb9 50%, #93ccff 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
            }}
          >
            🦷
          </div>
          <span
            style={{
              fontSize: "48px",
              fontWeight: 800,
              color: "white",
              letterSpacing: "-1px",
            }}
          >
            Clínica Arca
          </span>
        </div>
        <span
          style={{
            fontSize: "24px",
            color: "rgba(255,255,255,0.85)",
            fontWeight: 500,
          }}
        >
          Centro Odontológico Especializado
        </span>
        <span
          style={{
            fontSize: "18px",
            color: "rgba(255,255,255,0.6)",
            marginTop: "12px",
          }}
        >
          Ortodoncia • Implantes • Odontopediatría • Estética Dental
        </span>
      </div>
    ),
    { ...size }
  );
}
