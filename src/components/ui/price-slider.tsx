"use client";
import * as SliderPrimitive from "@radix-ui/react-slider";

interface SliderProps {
  min: number;
  max: number;
  minVal: number;
  maxVal: number;
  onChange: (min: number, max: number) => void;
}

export default function PriceSlider({
  min,
  max,
  minVal,
  maxVal,
  onChange,
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      className="relative flex w-full touch-none select-none items-center py-4"
      min={min}
      max={max}
      step={1}
      value={[minVal, maxVal]}
      onValueChange={(values) => onChange(values[0], values[1])}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-base-200">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>

      {/* Thumb 1 (Min) */}
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-[3px] border-base-100 bg-primary shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />

      {/* Thumb 2 (Max) */}
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-[3px] border-base-100 bg-primary shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
}
