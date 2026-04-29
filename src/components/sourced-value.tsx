import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { confidenceColor, confidenceDot, type Provenance } from "@/lib/sourced";

/**
 * Renders a value with a small provenance dot. Hover reveals source, retrieval
 * timestamp, confidence, and any caveat. Designed to be drop-in next to existing
 * formatted numbers without restructuring layouts.
 */
export function SourcedCell({
  children,
  provenance,
  className = "",
  align = "right",
}: {
  children: React.ReactNode;
  provenance: Provenance;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1.5 ${align === "right" ? "justify-end" : ""} cursor-help ${className}`}>
            {children}
            <span className={`w-1.5 h-1.5 rounded-full ${confidenceDot(provenance.confidence)} opacity-70`} aria-label={`Data confidence: ${provenance.confidence}`} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-[11px] font-mono leading-relaxed">
          <div className="space-y-1">
            <div>
              <span className="text-muted-foreground">Source: </span>
              <span className="text-foreground">{provenance.source}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Retrieved: </span>
              <span className="text-foreground">{new Date(provenance.retrievedAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Confidence: </span>
              <span className={confidenceColor(provenance.confidence)}>{provenance.confidence.toUpperCase()}</span>
            </div>
            {provenance.note && (
              <div className="text-muted-foreground italic pt-1 border-t border-border/50">{provenance.note}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
