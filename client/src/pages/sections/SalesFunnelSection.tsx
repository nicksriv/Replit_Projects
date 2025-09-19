import { ChevronRightIcon, EditIcon, EyeIcon } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const courseData = [
  {
    id: 1,
    image: "/figmaAssets/rectangle-18.png",
    status: "Draft",
    type: "AI",
    title: "Introduction to Digital Marketing",
    updatedDays: 2,
    modules: 5,
    enrollments: 0,
    primaryAction: "Review AI Draft",
  },
  {
    id: 2,
    image: "/figmaAssets/rectangle-18-1.png",
    status: "Draft",
    type: "Manual",
    title: "Advances UX Design Principles",
    updatedDays: 2,
    modules: 5,
    enrollments: 0,
    primaryAction: "Start Building",
  },
  {
    id: 3,
    image: "/figmaAssets/rectangle-18-2.png",
    status: "Draft",
    type: "Manual",
    title: "Data Science Fundamentals",
    updatedDays: 2,
    modules: 5,
    enrollments: 0,
    primaryAction: "Review AI Draft",
  },
];

const tabData = [
  {
    value: "video",
    label: "Video",
    icon: "/figmaAssets/icon-21.svg",
    active: true,
  },
  {
    value: "in-progress",
    label: "In Progress",
    icon: "/figmaAssets/icon-20.svg",
    active: false,
  },
  {
    value: "published",
    label: "Published",
    icon: "/figmaAssets/icon-6.svg",
    active: false,
  },
];

export const SalesFunnelSection = (): JSX.Element => {
  return (
    <section className="flex flex-col w-full items-start gap-[15px] p-[30px] bg-text-colorwhite rounded-lg overflow-hidden relative">
      <div className="flex flex-col w-[473px] items-start gap-3.5 relative flex-[0_0_auto]">
        <h2 className="relative flex items-center justify-center self-stretch mt-[-1.00px] font-heading-h4-medium font-[number:var(--heading-h4-medium-font-weight)] text-text-colorvery-dark text-[length:var(--heading-h4-medium-font-size)] tracking-[var(--heading-h4-medium-letter-spacing)] leading-[var(--heading-h4-medium-line-height)] [font-style:var(--heading-h4-medium-font-style)]">
          Jump Back In
        </h2>

        <Tabs defaultValue="video" className="w-full">
          <TabsList className="flex h-[43px] w-full p-0 bg-solid-coloraccenta3 rounded-none">
            {tabData.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={`flex-1 h-full rounded-none border-b-2 ${
                  tab.active
                    ? "bg-solid-coloraccenta3 border-solid-colorsecondary text-solid-colorsecondary"
                    : "bg-solid-colorbglight-2 border-transparent text-text-colordark"
                } data-[state=active]:bg-solid-coloraccenta3 data-[state=active]:border-solid-colorsecondary data-[state=active]:text-solid-colorsecondary`}
              >
                <div className="inline-flex items-center justify-center gap-2">
                  <img
                    className="relative flex-[0_0_auto]"
                    alt="Icon"
                    src={tab.icon}
                  />
                  <span className="font-label-label-2-medium text-[length:var(--label-label-2-medium-font-size)] tracking-[var(--label-label-2-medium-letter-spacing)] leading-[var(--label-label-2-medium-line-height)] font-[number:var(--label-label-2-medium-font-weight)] whitespace-nowrap [font-style:var(--label-label-2-medium-font-style)]">
                    {tab.label}
                  </span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex flex-col items-start justify-center relative self-stretch w-full flex-[0_0_auto]">
            <img
              className="relative self-stretch w-full h-px object-cover"
              alt="Divider"
              src="/figmaAssets/divider.svg"
            />
          </div>
        </Tabs>
      </div>

      <div className="flex w-full items-center gap-[25px] relative flex-[0_0_auto] overflow-x-auto">
        <Button
          variant="ghost"
          size="icon"
          className="flex w-[54px] h-[54px] items-center justify-center gap-2.5 p-1 bg-text-colorwhite rounded-[26px] rotate-180 shadow-[1px_1px_14px_#00000040] flex-shrink-0"
        >
          <ChevronRightIcon className="w-8 h-8 -rotate-180" />
        </Button>

        {courseData.map((course, index) => (
          <Card
            key={course.id}
            className="flex flex-col w-[379px] items-center justify-center relative flex-shrink-0 border-[#d6deff]"
          >
            <CardContent className="p-0 w-full">
              <div className="flex flex-col items-start gap-2.5 relative self-stretch w-full flex-[0_0_auto]">
                <img
                  className="relative self-stretch w-full h-[226px] rounded-[12px_12px_0px_0px] object-cover"
                  alt="Course thumbnail"
                  src={course.image}
                />
              </div>

              <div className="flex flex-col items-start gap-7 pt-[15px] pb-10 px-[15px] relative self-stretch w-full flex-[0_0_auto] bg-text-colorwhite rounded-[0px_0px_12px_12px]">
                <div className="flex flex-col items-start gap-[18px] relative self-stretch w-full flex-[0_0_auto]">
                  <div className="flex items-center gap-2 relative">
                    <Badge className="bg-solid-coloractionwarning-light text-text-colordark-bg rounded-[100px] px-3 py-1.5 font-m3-label-large text-[length:var(--m3-label-large-font-size)] tracking-[var(--m3-label-large-letter-spacing)] leading-[var(--m3-label-large-line-height)] font-[number:var(--m3-label-large-font-weight)] [font-style:var(--m3-label-large-font-style)]">
                      {course.status}
                    </Badge>

                    <Badge className="bg-solid-coloractionerror-light text-text-colordark-bg rounded-[100px] px-3 py-1.5 font-m3-label-large text-[length:var(--m3-label-large-font-size)] tracking-[var(--m3-label-large-letter-spacing)] leading-[var(--m3-label-large-line-height)] font-[number:var(--m3-label-large-font-weight)] [font-style:var(--m3-label-large-font-style)]">
                      {course.type}
                    </Badge>
                  </div>

                  <div className="flex flex-col h-[54px] items-start relative self-stretch w-full">
                    <h3 className="relative self-stretch mt-[-1.00px] font-heading-h4-bold font-[number:var(--heading-h4-bold-font-weight)] text-text-colorvery-dark text-[length:var(--heading-h4-bold-font-size)] tracking-[var(--heading-h4-bold-letter-spacing)] leading-[var(--heading-h4-bold-line-height)] [font-style:var(--heading-h4-bold-font-style)]">
                      {course.title}
                    </h3>

                    <div className="relative w-[328px] [font-family:'Manrope',Helvetica] font-normal text-solid-coloraccenta2 text-[13px] leading-[13px]">
                      <span className="font-medium text-[#7e86c1] tracking-[0] leading-[0.1px]">
                        Updated {course.updatedDays} days ago{" "}
                      </span>
                      <span className="font-medium text-[#7e86c1] tracking-[-0.02px] leading-4">
                        &nbsp;
                      </span>
                      <span className="text-[#7e86c1] text-[length:var(--label-label-1-regular-font-size)] tracking-[var(--label-label-1-regular-letter-spacing)] leading-[var(--label-label-1-regular-line-height)] font-label-label-1-regular [font-style:var(--label-label-1-regular-font-style)] font-[number:var(--label-label-1-regular-font-weight)]">
                        {" "}
                        |
                      </span>
                      <span className="font-medium text-[#7e86c1] tracking-[-0.02px] leading-4">
                        &nbsp;&nbsp;
                      </span>
                      <span className="font-medium text-[#7e86c1] tracking-[0] leading-[0.1px]">
                        {" "}
                        {course.modules} Modules
                      </span>
                      <span className="font-medium text-[#7e86c1] tracking-[-0.02px] leading-4">
                        &nbsp;&nbsp;
                      </span>
                      <span className="font-medium text-[#7e86c1] tracking-[0] leading-[0.1px]">
                        &nbsp;
                      </span>
                      <span className="font-[number:var(--heading-h2-bold-font-weight)] text-[#7e86c1] text-[length:var(--heading-h2-bold-font-size)] tracking-[var(--heading-h2-bold-letter-spacing)] leading-[var(--heading-h2-bold-line-height)] font-heading-h2-bold [font-style:var(--heading-h2-bold-font-style)]">
                        .
                      </span>
                      <span className="font-medium text-[#7e86c1] tracking-[0] leading-[0.1px]">
                        &nbsp;
                      </span>
                      <span className="font-medium text-[#7e86c1] tracking-[-0.02px] leading-4">
                        &nbsp;&nbsp;
                      </span>
                      <span className="font-medium text-[#7e86c1] tracking-[0] leading-[0.1px]">
                        {course.enrollments} Enrollments
                      </span>
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-[13px] relative flex-[0_0_auto]">
                  <Button
                    variant="ghost"
                    className="flex w-[107px] h-9 items-center justify-center bg-solid-coloraccenta3 rounded-md text-solid-colorprimary hover:bg-solid-coloraccenta3/80 h-auto"
                  >
                    <EyeIcon className="w-5 h-5 mr-2" />
                    <span className="font-label-label-2-medium text-[length:var(--label-label-2-medium-font-size)] tracking-[var(--label-label-2-medium-letter-spacing)] leading-[var(--label-label-2-medium-line-height)] font-[number:var(--label-label-2-medium-font-weight)] whitespace-nowrap [font-style:var(--label-label-2-medium-font-style)]">
                      Preview
                    </span>
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex w-[78px] h-9 items-center justify-center bg-solid-coloraccenta3 rounded-md text-solid-colorprimary hover:bg-solid-coloraccenta3/80 h-auto"
                  >
                    <EditIcon className="w-5 h-5 mr-2" />
                    <span className="font-label-label-2-medium text-[length:var(--label-label-2-medium-font-size)] tracking-[var(--label-label-2-medium-letter-spacing)] leading-[var(--label-label-2-medium-line-height)] font-[number:var(--label-label-2-medium-font-weight)] whitespace-nowrap [font-style:var(--label-label-2-medium-font-style)]">
                      EditIcon
                    </span>
                  </Button>

                  <Button className="flex w-[135px] h-9 items-center justify-center bg-solid-colorprimary rounded-md text-text-colorwhite hover:bg-solid-colorprimary/90 h-auto">
                    <span className="mt-[-1.00px] font-label-label-2-medium text-[length:var(--label-label-2-medium-font-size)] tracking-[var(--label-label-2-medium-letter-spacing)] leading-[var(--label-label-2-medium-line-height)] font-[number:var(--label-label-2-medium-font-weight)] whitespace-nowrap [font-style:var(--label-label-2-medium-font-style)]">
                      {course.primaryAction}
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="ghost"
          size="icon"
          className="flex w-[54px] h-[54px] items-center justify-center gap-2.5 p-1 bg-text-colorwhite rounded-[26px] shadow-[2px_2px_14px_#00000040] flex-shrink-0"
        >
          <ChevronRightIcon className="w-8 h-8" />
        </Button>
      </div>

      <Button
        variant="link"
        className="absolute top-[34px] right-[30px] h-6 p-0 font-label-label-1-medium font-[number:var(--label-label-1-medium-font-weight)] tracking-[var(--label-label-1-medium-letter-spacing)] leading-[var(--label-label-1-medium-line-height)] underline [font-style:var(--label-label-1-medium-font-style)] text-[length:var(--label-label-1-medium-font-size)] text-solid-colorsecondary hover:text-solid-colorsecondary/80 h-auto"
      >
        Go to All courses
      </Button>
    </section>
  );
};
