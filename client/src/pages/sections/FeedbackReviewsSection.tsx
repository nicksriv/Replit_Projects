import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const FeedbackReviewsSection = (): JSX.Element => {
  const linkItems = [
    "How to market your first course",
    "Join our creator community",
    "Submit a feature request",
  ];

  return (
    <section className="flex flex-col w-full items-end relative">
      <Card className="relative w-full max-w-[507px] bg-white rounded-lg border-0 shadow-sm">
        <CardContent className="flex flex-col w-full items-start gap-[15px] p-[29px_29px_22px_29px]">
          {linkItems.map((linkText, index) => (
            <div key={index} className="flex items-center gap-2.5 w-full">
              <a
                href="#"
                className="[font-family:'Manrope',Helvetica] font-medium text-[#3671ff] text-[15px] leading-[18px] underline hover:no-underline transition-all duration-200"
              >
                {linkText}
              </a>
            </div>
          ))}
        </CardContent>
      </Card>

      <img
        className="absolute w-[165.55px] h-[126.99px] -top-[72px] -left-[136px] z-0"
        alt="Group"
        src="/figmaAssets/group.png"
      />
    </section>
  );
};
