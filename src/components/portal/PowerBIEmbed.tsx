"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  embedUrl: string; // Power BI "Publiceren op web" embed URL
}

export default function PowerBIEmbed({ embedUrl }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-gray-100"
      style={{ height: "calc(100vh - 160px)", minHeight: 500 }}>

      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-navy-700 animate-spin mb-3" />
          <span className="text-gray-500 text-sm">Dashboard laden...</span>
        </div>
      )}

      <iframe
        title="Power BI Dashboard"
        src={embedUrl}
        onLoad={() => setLoaded(true)}
        className="w-full h-full border-0"
        allowFullScreen
      />
    </div>
  );
}
