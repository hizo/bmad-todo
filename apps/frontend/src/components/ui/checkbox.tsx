import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "relative h-5 w-5 shrink-0 cursor-pointer rounded-full border-2 border-[#E7E5E4] bg-white",
        "transition-colors duration-200 motion-reduce:transition-none",
        "data-[checked]:border-[#F59E0B] data-[checked]:bg-[#F59E0B]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="absolute inset-0 flex items-center justify-center">
        <Check aria-hidden="true" className="h-3 w-3 stroke-white stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
