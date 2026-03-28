# Cadence — Iteration 2 Feature Changes

This document tracks all proposed features for Iteration 2, their implementation status, and descriptions.

---

## Implemented Features

### 1. Improvement of AI and Condition Score Explanation Justification
**Status: Implemented**

Enhanced the AI verification system to return per-sub-score justifications explaining *why* each score is high or low, instead of just a single paragraph summary. Each of the 4 authenticity sub-scores and 4 condition sub-scores now includes an individual justification visible on the listing detail page and verification results. This gives buyers and sellers transparent, educational insight into what the AI detected.

### 2. Change Pictures of Albums to Live Listings Already Online
**Status: Implemented**

The homepage now dynamically fetches and displays real listings from the database instead of showing only static marketing content. A "Latest Listings" section showcases recently added items with their actual images, prices, and seller info, giving visitors an immediate sense of the marketplace.

### 3. Add Setlist/Tracklist to Music Albums (Side A / Side B)
**Status: Implemented**

Listings now support a tracklist field with Side A / Side B formatting for vinyl, and numbered track lists for CDs and cassettes. Sellers can add, edit, and reorder tracks when creating or editing a listing. The tracklist is displayed in a styled section on the listing detail page, adapting its layout to the listing type.

### 4. More Vinyls (Seed Data Variety)
**Status: Implemented**

Expanded the seed data with more diverse listings across all supported types. Added additional badges and visual tags to listing cards to make browsing more engaging (see Feature #17).

### 5. Add CDs, Cassette Tapes, Merch
**Status: Already Implemented (Iteration 1)**

The `ListingType` enum already supports VINYL, CD, CASSETTE, MERCH, and EQUIPMENT. The create form, marketplace filters, AI verification, and type-specific scoring labels all handle these types. No changes needed.

### 6. Integrate Condition Grading Guide
**Status: Implemented**

Added a reusable Condition Grading Guide dialog accessible from the marketplace page (near condition filters), the listing detail page (next to the condition badge), and the create listing form (next to the condition selector). The guide explains each grade from Brand New to Heavily Used with detailed descriptions of what buyers and sellers should expect.

### 7. Validate with Users on the Price We Set (Subscription Fee, Commission Fee)
**Status: Not Implemented — Out of Scope**

This is a business validation exercise best handled through user interviews and surveys, not a technical feature. Pricing model decisions should be informed by market research and user feedback gathered outside the codebase.

### 8. Find Out Other Possible Streams of Revenue and Cost
**Status: Not Implemented — Out of Scope**

Business model research that doesn't translate to code changes. Revenue stream exploration should be done through competitive analysis and business planning documents.

### 9. Seller Chat
**Status: Already Implemented (Iteration 1)**

The `FloatingChat` component provides real-time messaging between buyers and sellers with conversation list, unread message badges, and per-listing conversations. The full chat system includes `Conversation` and `Message` database models and REST API endpoints.

### 10. About Us Page
**Status: Already Implemented (Iteration 1)**

A full About Us page exists at `/about` with hero section, brand story, core values, differentiators, team stats, and call-to-action sections.

### 11. Save Credit Card for Fast Purchase
**Status: Implemented (Simulated)**

Since the entire payment system is a fake/simulated prototype, saved card details are stored raw in the database. When a user checks "Save payment information for future purchases" during checkout, their card number, name, expiry, and type are saved. On subsequent checkouts, the saved card is automatically pre-filled. Users can also clear their saved card and use a different one. All code includes prominent comments noting this is only acceptable for a fake payment system and that a real implementation must use PCI-compliant processors like Stripe.

### 12. Loyalty Points System for Discount
**Status: Not Implemented — Out of Scope**

A loyalty points system (accrual, redemption, expiry logic, UI integration across checkout and profile) carries medium-high complexity with low demo impact for a school project. Better suited for a production iteration if the project continues.

### 13. Watchlist for Listings
**Status: Already Implemented (Iteration 1)**

The `Favorite` model, `/api/favorites` API endpoints, dedicated `/favorites` page, and heart toggle button on listing cards provide full watchlist functionality.

### 14. Activity Feed (New Listings from Followed Sellers)
**Status: Not Implemented — Out of Scope**

Requires building a new "follow seller" system (data model, API, UI) plus a feed aggregation mechanism. The complexity is medium-high with relatively low payoff for a demo presentation.

### 15. Automatic Shipping Calculation
**Status: Implemented**

Shipping costs are now automatically calculated at checkout using Singapore postal codes. The system uses the free OneMap API (Singapore Land Authority) to geocode postal codes into coordinates, then applies the Haversine formula to calculate distance between buyer and seller. Shipping cost is mapped to three tiers based on real SingPost domestic parcel rates: Same Area (< 5km, S$3.50), Standard (5-15km, S$5.00), and Cross-Island (> 15km, S$6.50). Seeded sellers use SMU's address (81 Victoria St, 188065) as their shipping origin. The buyer enters their postal code at checkout and sees the shipping tier, distance, estimated delivery time, and resolved address in real-time.

### 16. Promotion Listings on the Homepage
**Status: Implemented**

Added a "Featured Listings" section to the homepage that showcases promoted listings in a visually distinct carousel. Promoted listings are highlighted with special badges and appear prominently. See also Feature #18.

### 17. Extra Badges/Tags for UI on the Product Card
**Status: Implemented**

Added visual badges to listing cards throughout the marketplace: "New" (created within 48 hours), "Great Deal" (for underpriced items), "AI Verified" (for verified listings), "Promoted" (for featured listings), and listing type indicators. Badges appear on both the marketplace browse page and individual listing detail pages.

### 18. Sellers Can Pay to Promote Their Listing
**Status: Implemented**

Added a promotion system where sellers can promote their listings (simulated payment). Promoted listings receive a "Promoted" badge, appear in the homepage featured section, and are prioritized at the top of marketplace search results. This demonstrates a viable revenue model for the platform.
