BrightLocal product map — how to interpret lazy vertical prompts.
When a request names a product vertical ("the hub page for Citations", "rankings page", "reviews dashboard"), do NOT invent navigation: use the standard app shell (SidebarProvider > GlobalLayout > GlobalLayoutSidebar > Sidebar with Header/Content/Footer, footer = SidebarAccountDropdown), set isActive on that vertical's nav item, and title the page header for the vertical. Location nav items, in order: Location Summary, AI Insights, Rankings, Local Search Grid, Citations, GBP, Reputation & Reviews.
Hub-page conventions per vertical (a hub = score/stat summary row + one primary work surface + one CTA):
- Citations — citations-found score (e.g. 53/60), listings sync status, directory table (directory name, listing status, NAP accuracy), CTA "Build Citations".
- Rankings — average ranking position, keywords in top 3, search visibility %, tracked-keywords table, CTA "Run New Audit".
- Local Search Grid — geo-grid map as the primary surface, keyword selector, competitor comparison beside it.
- GBP — profile-completeness score, field-level audit checklist, sync status.
- Reputation & Reviews — average rating, review velocity, per-site breakdown (Google, Facebook, Yelp), reply queue.
- Location Summary — the overview dashboard: visibility score, rating, citations and actions-required stat cards.
