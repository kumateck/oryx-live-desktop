import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { reportApplicationError } from "@/shared/errors/report-error";

interface Props { label: string; onRetry: () => void; children: ReactNode }

/** A failed specialized field leaves the rest of the analyst's unsaved answers available. */
export class CustomFieldBoundary extends Component<Props, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch(error: Error, info: ErrorInfo) {
    reportApplicationError(error, `form field: ${this.props.label} (${info.componentStack ?? ""})`);
  }
  override render() {
    if (!this.state.failed) return this.props.children;
    return <div role="alert" className="space-y-2 rounded-md border border-destructive/30 p-3 text-sm">
      <p>Could not load {this.props.label}. Check your connection and retry.</p>
      <Button type="button" variant="outline" size="sm" onClick={this.props.onRetry}>Retry field</Button>
    </div>;
  }
}
