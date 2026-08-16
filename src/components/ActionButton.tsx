import type { ButtonHTMLAttributes } from "react";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
};

const variantClass = {
  primary: "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300",
  secondary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
  outline:
    "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400",
};

export function ActionButton({
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-10 min-w-[120px] sm:min-w-0 flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold shadow-sm transition-colors ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
}
