import React from 'react';
import { Card, CardContent } from '@/components/common/Card';

interface QuickStartCardProps {
  steps: string[];
}

export const QuickStartCard: React.FC<QuickStartCardProps> = ({ steps }) => (
  <Card className="border-dashed border-primary/25 bg-primary/[0.02]">
    <CardContent className="py-4 text-sm text-muted-foreground space-y-1">
      <p className="font-semibold text-foreground">Quick Start</p>
      {steps.map((step, i) => (
        <p key={i}>{i + 1}. {step}</p>
      ))}
    </CardContent>
  </Card>
);
