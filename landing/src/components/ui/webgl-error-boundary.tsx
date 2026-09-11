"use client";

import React, { Component, ReactNode } from "react";

export function WebGLFallback({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: "radial-gradient(ellipse at center, #001d3d 0%, #000814 100%)",
      }}
    />
  );
}

interface Props {
  fallback?: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn("WebGL render error caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <WebGLFallback />;
    }
    return this.props.children;
  }
}
