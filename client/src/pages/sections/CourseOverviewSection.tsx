import { HeartIcon, ReplyIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFigmaAsset } from "@/lib/assets";

export const CourseOverviewSection = (): JSX.Element => {
  const reviewsData = [
    {
      id: 1,
      quote: "This was a fantastic overview!",
      course: "on introduction to Digital marketing",
      ratingImage: getFigmaAsset("group-177.png"),
    },
    {
      id: 2,
      quote: "This was a fantastic overview!",
      course: "on introduction to Digital marketing",
      ratingImage: getFigmaAsset("group-177-1.png"),
    },
    {
      id: 3,
      quote: "This was a fantastic overview!",
      course: "on introduction to Digital marketing",
      ratingImage: getFigmaAsset("group-177-2.png"),
    },
  ];

  return (
    <Card className="w-full bg-text-colorwhite rounded-lg">
      <CardContent className="flex flex-col items-start gap-5 pt-[15px] pb-5 px-5">
        <header className="flex items-center justify-between w-full">
          <h2 className="font-heading-h4-medium font-[number:var(--heading-h4-medium-font-weight)] text-text-colorvery-dark text-[length:var(--heading-h4-medium-font-size)] tracking-[var(--heading-h4-medium-letter-spacing)] leading-[var(--heading-h4-medium-line-height)] [font-style:var(--heading-h4-medium-font-style)]">
            Feedback &amp; Reviews
          </h2>

          <Button
            variant="link"
            className="h-auto p-0 [font-family:'Manrope',Helvetica] font-normal text-solid-colorsecondary text-[17px] leading-[17px]"
          >
            <span className="font-[number:var(--label-label-1-medium-font-weight)] tracking-[var(--label-label-1-medium-letter-spacing)] leading-[var(--label-label-1-medium-line-height)] underline font-label-label-1-medium [font-style:var(--label-label-1-medium-font-style)] text-[length:var(--label-label-1-medium-font-size)]">
              View All
            </span>
          </Button>
        </header>

        <div className="flex flex-col w-full items-start justify-between">
          {reviewsData.map((review, index) => (
            <article
              key={review.id}
              className="flex items-center gap-[34px] px-0 py-0.5 w-full border-b border-solid border-[#f5f6f8]"
            >
              <div className="flex flex-col flex-1 items-start gap-[11px]">
                <div className="flex items-center gap-1.5 w-full">
                  <div className="font-label-label-1-medium font-[number:var(--label-label-1-medium-font-weight)] text-text-colordark-bg text-[length:var(--label-label-1-medium-font-size)] tracking-[var(--label-label-1-medium-letter-spacing)] leading-[var(--label-label-1-medium-line-height)] [font-style:var(--label-label-1-medium-font-style)]">
                    &quot;{review.quote}&quot;
                  </div>

                  <img
                    className="w-[117.26px] h-5"
                    alt="Rating stars"
                    src={review.ratingImage}
                  />
                </div>

                <div className="font-label-label-3-regular font-[number:var(--label-label-3-regular-font-weight)] text-solid-coloraccenta2 text-[length:var(--label-label-3-regular-font-size)] tracking-[var(--label-label-3-regular-letter-spacing)] leading-[var(--label-label-3-regular-line-height)] [font-style:var(--label-label-3-regular-font-style)]">
                  {review.course}
                </div>
              </div>

              <div className="flex w-[65px] items-center gap-[9px]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-auto w-7 h-7 p-0"
                >
                  <ReplyIcon className="w-7 h-7" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-auto w-7 h-7 p-0"
                >
                  <HeartIcon className="w-7 h-7" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
