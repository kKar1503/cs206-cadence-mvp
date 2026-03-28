"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";

const CONDITIONS = [
  {
    grade: "Brand New",
    value: "BRAND_NEW",
    color: "bg-green-500",
    description:
      "Item has never been used or opened. May still be in original shrink wrap or packaging with all original tags, inserts, and accessories included.",
    buyerExpect:
      "Expect a flawless item identical to what you'd find in a retail store.",
    sellerTip:
      "Only use this grade if the item is truly untouched. Include photos showing sealed packaging if applicable.",
  },
  {
    grade: "Like New",
    value: "LIKE_NEW",
    color: "bg-emerald-400",
    description:
      "Item has been used once or twice but shows virtually no signs of wear. Packaging may have been opened but the item itself is in pristine condition.",
    buyerExpect:
      "The item will look and feel almost brand new with no noticeable flaws.",
    sellerTip:
      "Appropriate for items played/used minimally. Mention if original packaging is included.",
  },
  {
    grade: "Lightly Used",
    value: "LIGHTLY_USED",
    color: "bg-yellow-400",
    description:
      "Item has been used with care and shows only minor signs of wear. Any flaws are barely noticeable and do not affect functionality or enjoyment.",
    buyerExpect:
      "Minor surface marks or light wear may be present but nothing that impacts the listening/viewing experience.",
    sellerTip:
      "Be upfront about any small imperfections. Close-up photos of any wear are appreciated by buyers.",
  },
  {
    grade: "Well Used",
    value: "WELL_USED",
    color: "bg-orange-400",
    description:
      "Item has been regularly used and shows clear signs of wear. May have minor cosmetic defects, scuffs, or marks, but remains fully functional.",
    buyerExpect:
      "Visible wear is present. Vinyl may have light surface noise; cases may show scratches or wear marks.",
    sellerTip:
      "Clearly describe and photograph all defects. Buyers appreciate honesty — it builds trust and avoids disputes.",
  },
  {
    grade: "Heavily Used",
    value: "HEAVILY_USED",
    color: "bg-red-400",
    description:
      "Item has obvious signs of heavy use. May have significant cosmetic damage, deep scratches, writing, stickers, or other notable wear. Still functional but well-loved.",
    buyerExpect:
      "Expect noticeable wear and possible playback issues (pops, skips). Best for collectors seeking specific pressings regardless of condition.",
    sellerTip:
      "Document all damage thoroughly with close-up photos. Price accordingly — heavily used items should reflect their condition.",
  },
];

interface ConditionGradingGuideProps {
  children?: React.ReactNode;
}

export function ConditionGradingGuide({ children }: ConditionGradingGuideProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Grading Guide</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Condition Grading Guide</DialogTitle>
          <DialogDescription>
            Understanding condition grades helps you buy and sell with confidence.
            Each grade reflects the item&apos;s physical state and expected quality.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {CONDITIONS.map((condition) => (
            <div
              key={condition.value}
              className="rounded-lg border p-4"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${condition.color}`} />
                <h3 className="text-lg font-semibold">{condition.grade}</h3>
              </div>

              <p className="mb-3 text-sm text-muted-foreground">
                {condition.description}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Buyer Expectation
                  </p>
                  <p className="text-sm">{condition.buyerExpect}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Seller Tip
                  </p>
                  <p className="text-sm">{condition.sellerTip}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium">
              Not sure about your item&apos;s condition?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use our AI Verification tool after listing to get an automated condition
              assessment with detailed scoring across multiple quality factors.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
