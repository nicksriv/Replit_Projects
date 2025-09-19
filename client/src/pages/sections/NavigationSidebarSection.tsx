import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigationItems = [
  {
    id: "create-course",
    label: "Create New Course",
    icon: "/figmaAssets/selected-icon.svg",
    isActive: false,
    isPrimary: true,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "/figmaAssets/vector.svg",
    isActive: true,
    isPrimary: false,
  },
  {
    id: "my-courses",
    label: "My Courses",
    icon: "/figmaAssets/icon-9.svg",
    isActive: false,
    isPrimary: false,
  },
];

const workspaceItems = [
  {
    id: "revenue-payouts",
    label: "Revenue & Payouts",
    icon: "/figmaAssets/icon-8.svg",
  },
  {
    id: "learner-management",
    label: "Learner Management",
    icon: "/figmaAssets/icon-13.svg",
  },
  {
    id: "skills-management",
    label: "Skills Management",
    icon: "/figmaAssets/icon-15.svg",
  },
  {
    id: "reports",
    label: "Reports",
    icon: "/figmaAssets/icon-16.svg",
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: "/figmaAssets/vector-1.svg",
  },
];

const bottomItems = [
  {
    id: "settings",
    label: "Settings",
    icon: "/figmaAssets/icon-17.svg",
  },
  {
    id: "help-support",
    label: "Help & Support",
    icon: "/figmaAssets/icon-14.svg",
  },
];

export const NavigationSidebarSection = (): JSX.Element => {
  return (
    <nav className="flex flex-col w-[222px] min-h-screen bg-text-colorwhite pt-[30px] pb-0 px-2.5">
      <div className="flex flex-col w-[202px] items-start gap-[300px] relative">
        <div className="flex flex-col items-start gap-40 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-5 relative self-stretch w-full flex-[0_0_auto]">
            <header className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex flex-col h-16 items-start gap-2.5 relative self-stretch w-full">
                <div className="inline-flex items-center gap-2.5 relative flex-[0_0_auto]">
                  <img
                    className="relative w-40 h-[30px]"
                    alt="Vertx logo blue"
                    src="/figmaAssets/vertx-logo--blue--5.png"
                  />
                </div>
                <div className="relative self-stretch w-full h-6 bg-white" />
              </div>

              {navigationItems.map((item) => (
                <div
                  key={item.id}
                  className="flex h-[55px] items-start justify-around px-0 py-1 relative self-stretch w-full rounded"
                >
                  <Button
                    variant="ghost"
                    className={`h-auto flex flex-col items-start justify-center relative flex-1 self-stretch grow rounded-lg overflow-hidden p-0 ${
                      item.isPrimary
                        ? "bg-solid-colorprimary hover:bg-solid-colorprimary/90"
                        : item.isActive
                          ? "bg-solid-coloraccenta1 hover:bg-solid-coloraccenta1/90"
                          : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex gap-2 px-3 py-2.5 flex-1 self-stretch w-full grow items-center relative">
                      {item.icon.includes("vector") ? (
                        <div className="inline-flex items-center gap-2.5 px-[3px] py-0.5 relative flex-[0_0_auto]">
                          <img
                            className="relative w-5 h-[21px] mt-[-1.00px] mb-[-1.00px] ml-[-1.00px] mr-[-1.00px]"
                            alt="Vector"
                            src={item.icon}
                          />
                        </div>
                      ) : (
                        <img
                          className="relative w-[18px] h-[18px]"
                          alt={`${item.label} icon`}
                          src={item.icon}
                        />
                      )}
                      <span
                        className={`font-[number:var(--label-label-2-medium-font-weight)] relative flex items-center justify-center w-fit font-label-label-2-medium text-[length:var(--label-label-2-medium-font-size)] text-center tracking-[var(--label-label-2-medium-letter-spacing)] leading-[var(--label-label-2-medium-line-height)] whitespace-nowrap [font-style:var(--label-label-2-medium-font-style)] ${
                          item.isPrimary
                            ? "text-solid-colorbglight-2"
                            : "text-text-colorvery-dark"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </Button>
                </div>
              ))}
            </header>

            <Separator className="relative self-stretch w-full h-px" />

            <section className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex h-10 items-start justify-around relative self-stretch w-full rounded">
                <div className="flex flex-col items-start justify-center relative flex-1 self-stretch grow rounded-lg overflow-hidden">
                  <div className="flex gap-2 px-3 py-0 flex-1 self-stretch w-full grow items-center relative">
                    <h2 className="font-[number:var(--label-label-2-bold-font-weight)] text-solid-coloraccenta2 relative flex items-center justify-center w-fit font-label-label-2-bold text-[length:var(--label-label-2-bold-font-size)] text-center tracking-[var(--label-label-2-bold-letter-spacing)] leading-[var(--label-label-2-bold-line-height)] whitespace-nowrap [font-style:var(--label-label-2-bold-font-style)]">
                      Workspace
                    </h2>
                  </div>
                </div>
              </div>

              {workspaceItems.map((item) => (
                <div
                  key={item.id}
                  className="flex h-[55px] items-start justify-around px-0 py-1 relative self-stretch w-full rounded"
                >
                  <Button
                    variant="ghost"
                    className="h-auto flex flex-col items-start justify-center relative flex-1 self-stretch grow rounded-lg overflow-hidden p-0 hover:bg-gray-50"
                  >
                    <div className="flex gap-2 px-3 py-2.5 flex-1 self-stretch w-full grow items-center relative">
                      {item.icon.includes("vector") ? (
                        <div className="inline-flex items-center gap-2.5 px-[3px] py-0.5 relative self-stretch flex-[0_0_auto]">
                          <img
                            className="relative w-5 h-[21px] ml-[-1.00px] mr-[-1.00px]"
                            alt="Vector"
                            src={item.icon}
                          />
                        </div>
                      ) : (
                        <img
                          className="relative flex-[0_0_auto]"
                          alt={`${item.label} icon`}
                          src={item.icon}
                        />
                      )}
                      <span
                        className={`font-label-label-2-medium text-solid-coloraccenta2 text-[length:var(--label-label-2-medium-font-size)] text-center tracking-[var(--label-label-2-medium-letter-spacing)] leading-[var(--label-label-2-medium-line-height)] relative flex items-center justify-center w-fit font-[number:var(--label-label-2-medium-font-weight)] whitespace-nowrap [font-style:var(--label-label-2-medium-font-style)] ${
                          item.id === "learner-management" ? "mr-[-2.00px]" : ""
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </Button>
                </div>
              ))}
            </section>
          </div>

          <section className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
            {bottomItems.map((item) => (
              <div
                key={item.id}
                className="flex h-[55px] items-start justify-around px-0 py-1 relative self-stretch w-full rounded"
              >
                <Button
                  variant="ghost"
                  className="h-auto flex flex-col items-start justify-center relative flex-1 self-stretch grow rounded-lg overflow-hidden p-0 hover:bg-gray-50"
                >
                  <div className="flex gap-2 px-3 py-2.5 flex-1 self-stretch w-full grow items-center relative">
                    <img
                      className="relative flex-[0_0_auto]"
                      alt={`${item.label} icon`}
                      src={item.icon}
                    />
                    <span className="font-label-label-2-medium text-solid-coloraccenta2 text-[length:var(--label-label-2-medium-font-size)] text-center tracking-[var(--label-label-2-medium-letter-spacing)] leading-[var(--label-label-2-medium-line-height)] relative flex items-center justify-center w-fit font-[number:var(--label-label-2-medium-font-weight)] whitespace-nowrap [font-style:var(--label-label-2-medium-font-style)]">
                      {item.label}
                    </span>
                  </div>
                </Button>
              </div>
            ))}
          </section>
        </div>

        <div className="flex h-[55px] items-start justify-around px-0 py-1 relative self-stretch w-full rounded">
          <Button
            variant="ghost"
            className="h-auto flex flex-col items-start justify-center relative flex-1 self-stretch grow rounded-lg overflow-hidden p-0 hover:bg-gray-50"
          >
            <div className="flex gap-2 px-3 py-2.5 flex-1 self-stretch w-full grow items-center relative">
              <img
                className="relative flex-[0_0_auto]"
                alt="Collapse icon"
                src="/figmaAssets/icon-18.svg"
              />
              <span className="font-label-label-2-medium text-solid-coloraccenta2 text-[length:var(--label-label-2-medium-font-size)] text-center tracking-[var(--label-label-2-medium-letter-spacing)] leading-[var(--label-label-2-medium-line-height)] relative flex items-center justify-center w-fit font-[number:var(--label-label-2-medium-font-weight)] whitespace-nowrap [font-style:var(--label-label-2-medium-font-style)]">
                Collapse
              </span>
            </div>
          </Button>
        </div>
      </div>
    </nav>
  );
};
