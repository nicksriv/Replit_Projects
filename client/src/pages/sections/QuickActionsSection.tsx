import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

export const QuickActionsSection = (): JSX.Element => {
  const quickActions = [
    {
      title: "Create New Course",
      icon: "/figmaAssets/main-icons-11.svg",
      isPrimary: true,
      className: "bg-solid-colorprimary text-text-colorwhite",
      route: "/courses/new",
    },
    {
      title: "Add New User",
      icon: "/figmaAssets/main-icons-5.svg",
      isPrimary: false,
      className:
        "bg-text-colorwhite text-text-colorvery-dark border border-solid border-[#7e86c1]",
      route: "/learners",
    },
    {
      title: "Schedule Live Session",
      icon: "/figmaAssets/main-icons-9.svg",
      isPrimary: false,
      className:
        "bg-text-colorwhite text-text-colorvery-dark border border-solid border-[#7e86c1]",
      route: "/courses",
    },
    {
      title: "Launch Coupon",
      icon: "/figmaAssets/main-icons-4.svg",
      isPrimary: false,
      className:
        "bg-text-colorwhite text-text-colorvery-dark border border-solid border-[#7e86c1]",
      route: "/marketing",
    },
  ];

  return (
    <section className="flex flex-col w-full items-start gap-[15px] px-[30px] py-[19px] rounded-[20px] overflow-hidden">
      <div className="flex flex-col w-full items-start gap-[17px] relative">
        <h2 className="relative w-[157px] mt-[-1.00px] font-heading-h3-medium font-[number:var(--heading-h3-medium-font-weight)] text-text-colorvery-dark text-[length:var(--heading-h3-medium-font-size)] tracking-[var(--heading-h3-medium-letter-spacing)] leading-[var(--heading-h3-medium-line-height)] [font-style:var(--heading-h3-medium-font-style)]">
          Quick Actions
        </h2>

        <div className="flex items-center gap-[25px] relative w-full">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.route}>
              <Card
                data-testid={`card-quick-action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex flex-col w-[264px] h-24 items-center gap-[13px] p-2.5 relative rounded-xl cursor-pointer hover:opacity-90 transition-opacity ${action.className}`}
              >
                <CardContent className="flex flex-col items-center gap-[13px] p-0">
                  <img
                    className={`relative flex-[0_0_auto] ${action.title === "Schedule Live Session" ? "w-10" : ""}`}
                    alt={`${action.title} icon`}
                    src={action.icon}
                  />

                  <div
                    className={`relative w-fit font-label-label-2-medium font-[number:var(--label-label-2-medium-font-weight)] text-[length:var(--label-label-2-medium-font-size)] text-center tracking-[var(--label-label-2-medium-letter-spacing)] leading-[var(--label-label-2-medium-line-height)] whitespace-nowrap [font-style:var(--label-label-2-medium-font-style)] ${action.isPrimary ? "text-text-colorwhite" : "text-text-colorvery-dark"}`}
                  >
                    {action.title}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
