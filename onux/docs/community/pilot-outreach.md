# Cinacoin Pilot Outreach Plan

Find 3 external teams to integrate Cinacoin and validate real-world SDK usage.

---

## Outreach Strategy

**Target Profile:** Web3 dApps that need multi-chain wallet support, non-EVM chain coverage (TON, TRON, Solana), or want to self-host their wallet connection infrastructure. Ideal candidates are projects already live on 1–2 chains but seeking to expand — especially those constrained by single-chain SDKs or high per-connection pricing.

**Ideal Candidates:** DeFi protocols looking for unified multi-chain auth and payments, NFT marketplaces expanding into new ecosystems, GameFi studios needing embedded wallet flows, and cross-chain bridge projects requiring advanced HTLC + AMM orchestration.

**Geographic Focus:** Global, with emphasis on Asia where TON and TRON adoption is strongest and wallet diversity is a real engineering challenge. Target teams actively shipping (GitHub activity, recent releases, active Discord/Telegram communities) rather than vaporware.

**Approach:** Lead with value, not product. Each outreach references the team's current stack and a specific expansion opportunity Cinacoin unlocks. No mass emails — every message is tailored. Offer a no-obligation technical demo and dedicated support. The goal is a 4-week pilot with clear success criteria and a co-marketing opportunity.

---

## Target List

### Team 1: DeFi Protocol Expanding to Solana/Starknet

**Profile:** Established DeFi protocol (lending, DEX, or yield aggregator) live on Ethereum + Polygon, actively planning or discussing expansion to Solana and/or Starknet.

**Pain Points Cinacoin Solves:**
- Maintaining separate wallet integrations for EVM and non-EVM chains is expensive and error-prone
- User onboarding friction increases with each new chain added
- Social login and passkey auth are rarely available on non-EVM deployments
- Multi-session synchronization across chains is a known unsolved problem

**Value Proposition:** Cinacoin's unified SDK connects 600+ wallets across EVM, Solana, Bitcoin, TON, and TRON from a single integration. Add Solana + Starknet support in days, not weeks. SIWX (CAIP-122) enables chain-agnostic authentication — users sign in once, operate everywhere. Smart Account support (ERC-4337) reduces gas costs for your users on Ethereum mainnet.

**How to Find:** GitHub repos with `@ethersproject` or `viem` imports + recent issues/discussions mentioning "solana" or "starknet". Twitter accounts posting about chain expansion. DeFiLlama protocol pages showing multi-chain TVL goals.

### Team 2: NFT Marketplace Adding TON/TRON Support

**Profile:** NFT marketplace currently supporting Ethereum and/or BSC, with community demand or roadmap items for TON or TRON ecosystem integration.

**Pain Points Cinacoin Solves:**
- TON and TRON wallet integration requires entirely different SDKs and auth flows
- Cross-chain asset listing and unified user profiles are complex to build
- Email/social login for NFT onboarding is a competitive advantage most marketplaces lack
- Maintaining multiple wallet providers increases surface area for bugs and security risks

**Value Proposition:** Cinacoin handles TON (Tonkeeper, OpenMask, etc.) and TRON (TronLink, etc.) wallets natively alongside EVM chains. One SDK, one auth flow, one user experience across all chains. Social login (Google, X, Discord) lowers the barrier to entry for mainstream NFT collectors. Self-hosting option means full data control and zero dependency on third-party wallet infrastructure.

**How to Find:** OpenSea/Rarible alternative projects, gaming NFT marketplaces, Telegram Mini App NFT stores (TON ecosystem), community Discord servers requesting TRON integration.

### Team 3: Cross-Bridge Needing HTLC + AMM Orchestration

**Profile:** Team building or operating a cross-chain bridge or liquidity routing protocol, needing to coordinate atomic swaps and liquidity across multiple chain families.

**Pain Points Cinacoin Solves:**
- Hashed Timelock Contracts (HTLCs) require deep chain-specific knowledge to implement correctly
- Automated Market Maker (AMM) integration varies wildly by chain and DEX architecture
- Session state synchronization during cross-chain transactions is fragile and error-prone
- Security audit surface area explodes with each new chain-specific implementation

**Value Proposition:** Cinacoin's bridge abstraction layer provides cross-chain session synchronization, HTLC coordination primitives, and a unified DEX aggregator interface. Instead of building chain-by-chain integrations, integrate once with Cinacoin and get routing, session management, and fallback handling across all supported chains. Combined with Smart Account support, enables gasless cross-chain UX for end users.

**How to Find:** Cross-chain infrastructure projects on GitHub, bridge aggregator protocols, teams building on LayerZero/Wormhole/CCIP, research groups publishing on atomic swap protocols.

---

## Outreach Process

**Step 1 — Research & Identification (Week 1):**
Identify specific teams matching each profile. Study their GitHub repos, Twitter/Discord activity, roadmap discussions, and recent funding announcements. Document their current tech stack, known pain points, and any public statements about expansion plans. Create a scoring rubric based on fit, activity level, and likelihood of pilot participation.

**Step 2 — Personalized Outreach (Week 1–2):**
Reach out via the most appropriate channel — email for formal contact, Twitter DMs for community builders, LinkedIn for CTOs/technical founders. Each message references their specific project and a concrete value proposition. Include a brief Cinacoin overview link and a call to action for a 30-minute demo. Follow up within 5 business days if no response.

**Step 3 — Technical Demo (Week 2–3):**
Conduct a live demo session (screen share) tailored to each team's use case. Show relevant Cinacoin features: wallet connection for their target chains, auth flows, payment/bridge APIs, and self-hosting setup. Share sandbox access for hands-on exploration. Record the session (with permission) for their internal team to review.

**Step 4 — Pilot Agreement (Week 3):**
Draft a lightweight pilot agreement covering scope (4 weeks), support commitments, success metrics, and co-marketing terms. Use the template in `pilot-agreement.md`. Legal review on both sides should be minimal — this is a technical collaboration, not a commercial contract. Target signature within 1 week of demo.

**Step 5 — Execution & Case Study (Week 4–8):**
Provide dedicated Slack/Discord channel for pilot support. Track integration progress against success metrics. Upon completion, co-publish a case study (with team approval) highlighting the integration journey, technical wins, and quantitative results. This case study feeds into future outreach and marketing materials.

---

## Support Package

Every pilot team receives a comprehensive support commitment designed to maximize their success:

**Dedicated Technical Support:** A named Cinacoin engineer assigned as the pilot's primary point of contact. Available via dedicated Slack/Discord channel during business hours (UTC+8 to UTC+0 coverage). Response time: under 4 hours for technical questions, under 24 hours for bug reports.

**Priority Bug Fixes & Feature Requests:** Pilot-related bugs are escalated to P0/P1 priority. Feature requests identified during the pilot are evaluated for the next release cycle. Pilot teams get early access to unreleased features relevant to their integration.

**Co-Marketing Opportunities:** Joint announcement tweet/post upon pilot launch. Guest blog post or technical deep-dive on the Cinacoin blog. Invitation to present the integration at Cinacoin community calls or Web3 conferences.

**Case Study Publication:** Upon successful integration, Cinacoin publishes a detailed case study (technical architecture, implementation timeline, results). The pilot team reviews and approves before publication. Both parties can use the case study for their own marketing.

**Official Examples Integration:** Successful pilot implementations may be incorporated into Cinacoin's official documentation and example repositories, with attribution to the pilot team.

---

## Success Metrics

A pilot is considered successful when the following criteria are met:

- **Integration Completion:** The team successfully integrates Cinacoin into their application within 4 weeks of agreement signing.
- **Developer Satisfaction:** The assigned developer(s) provide positive feedback on the SDK's usability, documentation quality, and support responsiveness (target: ≥ 4/5 rating).
- **Production Deployment:** The integration is deployed to a production or staging environment with real users (even if limited to a subset or feature flag).
- **Community References:** At least one of the following: public tweet/post about the integration, participation in a joint case study, or a testimonial quote usable in marketing materials.
- **Technical Validation:** No critical (P0) bugs remain unresolved at pilot conclusion. Any feature gaps are documented and prioritized.

---

*Last updated: 2026-06-04*
