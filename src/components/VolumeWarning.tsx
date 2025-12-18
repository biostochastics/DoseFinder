"use client";

import React from "react";
import {
  IconAlertTriangle,
  IconAlertCircle,
  IconInfoCircle,
  IconChevronRight,
  IconExternalLink,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  VolumeWarning as VolumeWarningType,
  VolumeValidationResult,
} from "@/lib/pharmacology/volumeLimits";
import { REGULATORY_REFERENCES } from "@/lib/pharmacology/constants";

// ============================================================================
// Types
// ============================================================================

interface VolumeWarningProps {
  warning: VolumeWarningType;
  onOverride?: () => void;
  showSuggestions?: boolean;
}

interface VolumeWarningPanelProps {
  validation: VolumeValidationResult;
  onOverride?: () => void;
  onApplySuggestion?: (suggestion: { type: string; newValue?: number }) => void;
  className?: string;
}

// ============================================================================
// Single Warning Component
// ============================================================================

export function VolumeWarningItem({
  warning,
  onOverride,
  showSuggestions = true,
}: VolumeWarningProps) {
  const severityConfig = {
    info: {
      bg: "bg-info/10",
      border: "border-info/30",
      text: "text-info",
      Icon: IconInfoCircle,
    },
    warning: {
      bg: "bg-warning/10",
      border: "border-warning/30",
      text: "text-warning",
      Icon: IconAlertCircle,
    },
    critical: {
      bg: "bg-destructive/10",
      border: "border-destructive/30",
      text: "text-destructive",
      Icon: IconAlertTriangle,
    },
  };

  const config = severityConfig[warning.severity];
  const Icon = config.Icon;

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-md p-3`}
      role="alert"
      aria-live={warning.severity === "critical" ? "assertive" : "polite"}
    >
      <div className="flex items-start gap-2">
        <Icon
          className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.text}`}
          stroke={1.5}
          aria-hidden="true"
        />
        <div className="flex-1 space-y-2">
          <p className={`text-sm font-medium ${config.text}`}>
            {warning.message}
          </p>

          {warning.notes && (
            <p className="text-xs text-muted-foreground">{warning.notes}</p>
          )}

          {/* Suggestions */}
          {showSuggestions && warning.suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Suggestions:
              </p>
              <ul className="text-xs space-y-1">
                {warning.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <IconChevronRight
                      className="h-3 w-3 mt-0.5 text-muted-foreground"
                      stroke={1.5}
                    />
                    <span>{suggestion.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Override Option */}
          {warning.canOverride && onOverride && warning.severity !== "info" && (
            <div className="mt-2 pt-2 border-t border-current/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOverride}
                className="text-xs h-7"
              >
                Override with justification
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Warning Panel Component
// ============================================================================

export function VolumeWarningPanel({
  validation,
  onOverride,
  onApplySuggestion,
  className = "",
}: VolumeWarningPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Filter out info-only warnings for critical count
  const criticalWarnings = validation.warnings.filter(
    (w) => w.severity === "critical",
  );
  const regularWarnings = validation.warnings.filter(
    (w) => w.severity === "warning",
  );
  const infoWarnings = validation.warnings.filter((w) => w.severity === "info");

  // Don't render if no warnings
  if (validation.warnings.length === 0) {
    return null;
  }

  // Only info warnings - show minimal display
  if (criticalWarnings.length === 0 && regularWarnings.length === 0) {
    if (infoWarnings.length > 0) {
      return (
        <div className={`space-y-2 ${className}`}>
          {infoWarnings.map((warning, i) => (
            <VolumeWarningItem
              key={i}
              warning={warning}
              showSuggestions={false}
            />
          ))}
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Summary header */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full justify-between h-auto py-2 px-3 ${
              criticalWarnings.length > 0
                ? "bg-destructive/10 hover:bg-destructive/20 text-destructive"
                : "bg-warning/10 hover:bg-warning/20 text-warning"
            }`}
          >
            <div className="flex items-center gap-2">
              {criticalWarnings.length > 0 ? (
                <IconAlertTriangle className="h-4 w-4" stroke={1.5} />
              ) : (
                <IconAlertCircle className="h-4 w-4" stroke={1.5} />
              )}
              <span className="text-sm font-medium">
                {criticalWarnings.length > 0
                  ? `${criticalWarnings.length} Critical Volume Issue${criticalWarnings.length > 1 ? "s" : ""}`
                  : `${regularWarnings.length} Volume Warning${regularWarnings.length > 1 ? "s" : ""}`}
              </span>
            </div>
            <IconChevronRight
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              stroke={1.5}
            />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-2 mt-2">
          {/* Volume summary */}
          <div className="text-sm px-3 py-2 bg-muted/50 rounded-md">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Species:</span>{" "}
                <span className="font-medium capitalize">
                  {validation.species}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Route:</span>{" "}
                <span className="font-medium uppercase">
                  {validation.route}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Calculated Volume:
                </span>{" "}
                <span className="font-medium">
                  {validation.volume.toFixed(3)} mL
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Weight:</span>{" "}
                <span className="font-medium">{validation.weight} kg</span>
              </div>
            </div>
            {validation.limit && (
              <div className="mt-2 pt-2 border-t text-xs">
                <span className="text-muted-foreground">Limit:</span>{" "}
                <span className="font-medium">
                  {validation.limit.maxMlPerKg} mL/kg or{" "}
                  {validation.limit.maxAbsoluteMl} mL absolute
                </span>
              </div>
            )}
          </div>

          {/* Individual warnings */}
          {[...criticalWarnings, ...regularWarnings].map((warning, i) => (
            <VolumeWarningItem
              key={i}
              warning={warning}
              onOverride={onOverride}
              showSuggestions
            />
          ))}

          {/* Action buttons for suggestions */}
          {onApplySuggestion && (
            <div className="flex flex-wrap gap-2 pt-2">
              {[...criticalWarnings, ...regularWarnings]
                .flatMap((w) => w.suggestions)
                .filter((s) => s.newValue !== undefined)
                .slice(0, 3)
                .map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => onApplySuggestion(suggestion)}
                    className="text-xs"
                  >
                    Apply: {suggestion.type.replace(/_/g, " ")}
                  </Button>
                ))}
            </div>
          )}

          {/* Reference link */}
          <div className="pt-2 border-t">
            <a
              href={REGULATORY_REFERENCES.NC3RS.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              NC3Rs Administration Guidelines
              <IconExternalLink className="h-3 w-3" stroke={1.5} />
            </a>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Info warnings shown separately */}
      {infoWarnings.length > 0 && isExpanded && (
        <div className="space-y-1 mt-2">
          {infoWarnings.map((warning, i) => (
            <VolumeWarningItem
              key={i}
              warning={warning}
              showSuggestions={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Simple Warning Badge
// ============================================================================

export function VolumeWarningBadge({
  validation,
}: {
  validation: VolumeValidationResult;
}) {
  if (validation.isValid) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <IconInfoCircle className="h-3 w-3" stroke={1.5} />
        Volume OK
      </span>
    );
  }

  const hasCritical = validation.warnings.some(
    (w) => w.severity === "critical",
  );

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${
        hasCritical ? "text-destructive" : "text-warning"
      }`}
    >
      {hasCritical ? (
        <IconAlertTriangle className="h-3 w-3" stroke={1.5} />
      ) : (
        <IconAlertCircle className="h-3 w-3" stroke={1.5} />
      )}
      Volume Limit Exceeded
    </span>
  );
}
