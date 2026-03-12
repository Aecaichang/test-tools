import * as React from "react";
import { Input as ShadcnInput } from "@/components/ui/input";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    return (
      <ShadcnInput
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
