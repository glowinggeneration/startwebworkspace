# Component source and adaptation map

Source paths are relative to this pack. Inspect and adapt source; do not blindly paste demos or install every dependency. Existing compatible implementations take priority. Static images illustrate resting states, not working animations.

| Supplied component | Source | Intended application |
| --- | --- | --- |
| SegmentedControl | UI_Component_Code_Collection.txt §01 | Board/List, Week/Month and scoped period controls |
| TabsTransitionPanel | TXT §07 | Activity Today/Weekly review |
| AnimatedNumberBasic | TXT §08 | Confirmed metric changes only |
| ToolbarDynamic / ToolbarExpandable | TXT §11–12 | Search/filter/export actions |
| InlineAction | TXT §13 or MD §5 | Edit target and compact contextual actions |
| CreditUsageCard | TXT §14 | Adapt meter to revenue target and capacity, remove credit-specific copy |
| ProfileCard / Expandable Profile Card | TXT §15 or MD §11 | Real contact details when accounts exist |
| OnboardingSetup | TXT §16 | Project setup guidance without fake completion |
| EditProfile / Edit Profile Modal | TXT §18 or MD §12 | Account creation panel form structure |
| InlineDisclosureMenu | TXT §21 | Contextual options with accessible menu behaviour |
| FloatingInput | TXT §22 | Form visual pattern with persistent labels |
| ScheduleButton | TXT §23 | Actual scheduling action |
| Tags / Tags Selector | TXT §24 or MD §14 | Industry and tag selection |
| SlotPicker | TXT §25 or MD §13 | Suggested calling times and scheduling |
| Shuffle Pinned List | MD §2 | Priorities and pinning; disable random shuffling |
| Animated Accordion | MD §4 | Project, billing and statement help/options |
| Animated Stepper | MD §8 | Activity counters and hours allocation |
| Timed Undo Action | MD §9 | Reversible nonfinancial edits, only when supported |
| Schedule Date Range Picker | MD §21 | Workload and finance date ranges |
| Social Authentication Buttons | MD §26 | Configured Google, X, Facebook, GitHub sign-in |
| Team Profile Accordion | MD §25 | Team workload expansion |
| Content Feed Tabs | MD §32 | List status tabs and counts |
| Split-Screen Registration Page | MD §34 | Sign-in layout adapted to existing auth |

MD means `source-materials/UI_Component_Code_Collection.md`; TXT means the corresponding `.txt` file. `codes_collection.zip` is an additional supplied source archive to inspect for reusable equivalents. `Untitled_UI_Avatars.zip` is included once as optional source material, not assigned to actual staff. Use actual user-uploaded photos or derived initials for real identities.

Avoid irrelevant demo widgets on operational pages: autoplay testimonials, decorative bento grids, carousel navigation without a carousel, model selection without a model task, cryptocurrency dialogs, social proof and floating application docks. Preserve a narrow dependency set. Consolidate overlapping component implementations into one source of truth and adapt imports to the actual repository.

For each component added later, record: component name; source; user task; shared primitive; tokens; input and output contract; permissions; loading/empty/error states; keyboard behaviour; responsive rule; validation performed. A component is complete only when its visible controls perform the promised action.
