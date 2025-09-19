import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const PerformanceSnapshotSection = (): JSX.Element => {
  const performanceData = [
    {
      label: "Revenue Today",
      value: "$58.50",
      icon: "/figmaAssets/icon.png",
      background:
        "bg-[linear-gradient(0deg,rgba(187,241,212,0.3)_0%,rgba(187,241,212,0.3)_100%),linear-gradient(0deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.5)_100%)]",
      labelWidth: "w-[114px]",
      gap: "gap-[17px]",
    },
    {
      label: "New Enrolments(24h)",
      value: "12",
      icon: "/figmaAssets/icon-1.png",
      background:
        "bg-[linear-gradient(0deg,rgba(207,207,255,0.3)_0%,rgba(207,207,255,0.3)_100%),linear-gradient(0deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.5)_100%)]",
      labelWidth: "w-[123px]",
      gap: "gap-[17px]",
      labelMargin: "mr-[-28.00px]",
    },
    {
      label: "Active Learners",
      value: "341",
      icon: "/figmaAssets/icon-2.png",
      background: "bg-solid-coloractionlight-orange",
      labelWidth: "w-[123px]",
      gap: "gap-1",
    },
    {
      label: "Avg Course Rating",
      value: "4.8/5",
      icon: "/figmaAssets/icon-3.png",
      background:
        "bg-[linear-gradient(0deg,rgba(253,232,182,0.3)_0%,rgba(253,232,182,0.3)_100%),linear-gradient(0deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.5)_100%)]",
      labelWidth: "w-[123px]",
      gap: "gap-1",
      labelMargin: "mr-[-3.00px]",
    },
  ];

  return (
    <section className="flex flex-col w-full items-start gap-[15px] p-[30px] bg-text-colorwhite rounded-lg">
      <h2 className="font-heading-h4-medium font-[number:var(--heading-h4-medium-font-weight)] text-text-colorvery-dark text-[length:var(--heading-h4-medium-font-size)] tracking-[var(--heading-h4-medium-letter-spacing)] leading-[var(--heading-h4-medium-line-height)] [font-style:var(--heading-h4-medium-font-style)]">
        Performance Snapshot
      </h2>

      <div className="flex items-center gap-[30px] w-full">
        {performanceData.map((item, index) => (
          <Card
            key={index}
            data-testid={`card-kpi-${item.label.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`}
            className={`flex w-[247px] h-32 items-center gap-[25px] p-5 rounded-xl ${item.background} border-0 shadow-none`}
          >
            <CardContent className="flex items-center gap-[25px] p-0 w-full">
              <div
                className={`flex flex-col ${item.labelWidth} items-start ${item.gap}`}
              >
                <div
                  className={`${item.labelMargin || ""} opacity-70 font-label-label-2-medium font-[number:var(--label-label-2-medium-font-weight)] text-text-colordark-bg text-[length:var(--label-label-2-medium-font-size)] tracking-[var(--label-label-2-medium-letter-spacing)] leading-[var(--label-label-2-medium-line-height)] [font-style:var(--label-label-2-medium-font-style)] ${index === 1 || index === 3 ? "whitespace-nowrap" : ""}`}
                >
                  {item.label}
                </div>

                <div 
                  data-testid={`text-kpi-value-${item.label.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`}
                  className="font-heading-h1-bold font-[number:var(--heading-h1-bold-font-weight)] text-[#202224] text-[length:var(--heading-h1-bold-font-size)] tracking-[var(--heading-h1-bold-letter-spacing)] leading-[var(--heading-h1-bold-line-height)] [font-style:var(--heading-h1-bold-font-style)]"
                >
                  {item.value}
                </div>
              </div>

              <img
                className={`w-[60px] h-[60px] ${index > 0 ? "mr-[-1.00px]" : ""}`}
                alt="Icon"
                src={item.icon}
              />

              <img
                className="absolute top-2 left-[218px] w-[18px] h-[18px]"
                alt="Main icons"
                src="/figmaAssets/main-icons-3.svg"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
