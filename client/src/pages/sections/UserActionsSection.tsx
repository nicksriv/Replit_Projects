import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const funnelData = [
  {
    label: "Visitors",
    value: "1,245",
    color: "bg-[#00aae1]",
    width: "w-full",
  },
  {
    label: "Leads",
    value: "483",
    color: "bg-[#00d7e1]",
    width: "w-[471px]",
  },
  {
    label: "Enrollments",
    value: "152",
    color: "bg-[#00d2aa]",
    width: "w-[355px]",
  },
  {
    label: "Paid",
    value: "68",
    color: "bg-[#8cd26e]",
    width: "w-[239px]",
  },
];

export const UserActionsSection = (): JSX.Element => {
  return (
    <Card className="w-full max-w-[630px] bg-text-colorwhite rounded-lg">
      <CardContent className="p-[30px] space-y-[41px]">
        <header className="flex items-center justify-between">
          <h2 className="font-heading-h4-medium font-[number:var(--heading-h4-medium-font-weight)] text-text-colorvery-dark text-[length:var(--heading-h4-medium-font-size)] tracking-[var(--heading-h4-medium-letter-spacing)] leading-[var(--heading-h4-medium-line-height)] [font-style:var(--heading-h4-medium-font-style)]">
            Sales Funnel
          </h2>

          <Button
            variant="link"
            className="h-auto p-0 [font-family:'Manrope',Helvetica] font-normal text-solid-colorsecondary text-[17px] leading-[17px] font-[number:var(--label-label-1-medium-font-weight)] tracking-[var(--label-label-1-medium-letter-spacing)] leading-[var(--label-label-1-medium-line-height)] font-label-label-1-medium [font-style:var(--label-label-1-medium-font-style)] text-[length:var(--label-label-1-medium-font-size)] underline"
          >
            View Details
          </Button>
        </header>

        <div className="flex flex-col items-center gap-2.5">
          {funnelData.map((item, index) => (
            <div
              key={item.label}
              className={`flex flex-col items-start px-2.5 py-[17px] ${item.width} h-[77px] ${item.color} rounded-[0px_0px_12px_12px]`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-label-label-2-semi-bold font-[number:var(--label-label-2-semi-bold-font-weight)] text-text-colorvery-dark text-[length:var(--label-label-2-semi-bold-font-size)] tracking-[var(--label-label-2-semi-bold-letter-spacing)] leading-[var(--label-label-2-semi-bold-line-height)] [font-style:var(--label-label-2-semi-bold-font-style)]">
                  {item.label}
                </span>

                <span className="font-label-label-1-semi-bold font-[number:var(--label-label-1-semi-bold-font-weight)] text-text-colorvery-dark text-[length:var(--label-label-1-semi-bold-font-size)] tracking-[var(--label-label-1-semi-bold-letter-spacing)] leading-[var(--label-label-1-semi-bold-line-height)] [font-style:var(--label-label-1-semi-bold-font-style)]">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
