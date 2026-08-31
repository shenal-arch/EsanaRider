import { forwardRef, type ButtonHTMLAttributes, type PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    size?: "large" | "medium" | "small";
    fullWidth?: boolean;
  }
>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className = "",
    variant = "primary",
    size = "large",
    fullWidth = true,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`button button--${variant} button--${size} ${fullWidth ? "button--full" : ""} ${className}`.trim()}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
});
