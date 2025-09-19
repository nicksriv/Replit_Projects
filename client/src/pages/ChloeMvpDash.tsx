import { BellIcon, MailIcon, SearchIcon } from "lucide-react";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CourseOverviewSection } from "./sections/CourseOverviewSection";
import { FeedbackReviewsSection } from "./sections/FeedbackReviewsSection";
import { NavigationSidebarSection } from "./sections/NavigationSidebarSection";
import { PerformanceSnapshotSection } from "./sections/PerformanceSnapshotSection";
import { QuickActionsSection } from "./sections/QuickActionsSection";
import { SalesFunnelSection } from "./sections/SalesFunnelSection";
import { UserActionsSection } from "./sections/UserActionsSection";

export const ChloeMvpDash = (): JSX.Element => {
  return (
    <div className="bg-[#f5f6f8] w-full min-h-screen flex">
      {/* Navigation Sidebar */}
      <div className="flex-shrink-0">
        <NavigationSidebarSection />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-text-colorwhite h-[72px] flex items-center justify-between px-[34px] py-2.5">
          <div className="flex items-center gap-[211px]">
            {/* SearchIcon Bar */}
            <div className="relative w-[434px]">
              <div className="flex items-center bg-solid-colorbglight rounded-xl px-[15px] py-3 h-[50px]">
                <SearchIcon className="w-5 h-5 text-solid-coloraccenta2 mr-5" />
                <span className="font-m3-body-large font-[number:var(--m3-body-large-font-weight)] text-solid-coloraccenta2 text-[length:var(--m3-body-large-font-size)] tracking-[var(--m3-body-large-letter-spacing)] leading-[var(--m3-body-large-line-height)] [font-style:var(--m3-body-large-font-style)]">
                  SearchIcon
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto w-12 h-12 rounded-full"
                >
                  <img
                    className="w-6 h-6"
                    alt="Icon"
                    src="/figmaAssets/icon-12.svg"
                  />
                </Button>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-[23px]">
              <div className="flex items-center gap-[30px]">
                <img
                  className="w-6 h-6"
                  alt="Main icons"
                  src="/figmaAssets/main-icons-12.svg"
                />
                <MailIcon className="w-[26px] h-[26px]" />
                <BellIcon className="w-6 h-6" />
              </div>
              <Avatar className="w-[42px] h-[42px]">
                <AvatarImage
                  src="/figmaAssets/ellipse-50.png"
                  alt="User avatar"
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-6">
          {/* Greeting */}
          <h1 className="font-title-title-3-bold font-[number:var(--title-title-3-bold-font-weight)] text-text-colorvery-dark text-[length:var(--title-title-3-bold-font-size)] tracking-[var(--title-title-3-bold-letter-spacing)] leading-[var(--title-title-3-bold-line-height)] [font-style:var(--title-title-3-bold-font-style)] mb-6">
            Good Morning, Chloe!
          </h1>

          {/* Dashboard Sections */}
          <div className="space-y-6">
            {/* Performance Snapshot - Full Width */}
            <div className="w-full">
              <PerformanceSnapshotSection />
            </div>

            {/* Quick Actions - Full Width */}
            <div className="w-full">
              <QuickActionsSection />
            </div>

            {/* Grid Layout for remaining sections */}
            <div className="grid grid-cols-12 gap-6">
              {/* Sales Funnel - Large section */}
              <div className="col-span-8">
                <SalesFunnelSection />
              </div>

              {/* Right column with Course Overview and Feedback Reviews */}
              <div className="col-span-4 space-y-6">
                <div>
                  <CourseOverviewSection />
                </div>
                <div>
                  <FeedbackReviewsSection />
                </div>
              </div>

              {/* User Actions - Bottom left */}
              <div className="col-span-8">
                <UserActionsSection />
              </div>
            </div>
          </div>
        </main>

        {/* GAIA Floating Button */}
        <div className="fixed bottom-6 right-6 w-[133px] h-[133px] rounded-[36px] bg-[linear-gradient(139deg,rgba(3,13,132,1)_0%,rgba(235,12,179,1)_100%)] flex items-center justify-center">
          <div className="text-center">
            <img
              className="w-9 h-[37px] mx-auto mb-2"
              alt="Group"
              src="/figmaAssets/group-181.png"
            />
            <div className="[font-family:'Manrope',Helvetica] font-bold text-white text-[29px] leading-[30px] mb-1.5">
              GAIA
            </div>
            <div className="[font-family:'Manrope',Helvetica] font-medium text-white text-lg leading-5">
              Generate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
