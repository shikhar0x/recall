"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  title?: string;
  retryLabel?: string;
}

/**
 * Reusable red error banner with an optional Retry action. Used by every
 * view so backend failures degrade gracefully and stay recoverable.
 */
export function ErrorBanner({
  message,
  onRetry,
  title = "Something went wrong",
  retryLabel = "Retry",
}: ErrorBannerProps) {
  return (
    <Alert
      variant="destructive"
      className="border-red-400/30 bg-red-400/10 text-red-300 [&>svg]:text-red-400 *:data-[slot=alert-description]:text-red-300/90"
    >
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p className="break-words">{message}</p>
        {onRetry ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="mt-1 min-h-[44px] border-red-400/40 bg-transparent text-red-200 hover:bg-red-400/10 hover:text-red-100"
          >
            <RotateCcw aria-hidden="true" />
            {retryLabel}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
