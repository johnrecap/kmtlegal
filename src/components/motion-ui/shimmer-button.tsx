import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function ShimmerButton({ className, ...props }: ButtonProps) {
  return <Button className={cn("kmt-motion-cta", className)} {...props} />;
}
