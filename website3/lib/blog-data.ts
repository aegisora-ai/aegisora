export const blogPosts = [
  {
    slug: "own-your-intelligence",
    title: "What does it mean to \"own your intelligence\"?",
    excerpt: "As AI agents evolve from read-only assistants to read-write autonomous entities, traditional API gateways fail. Discover why the execution boundary is the new frontline.",
    category: "Harrison's In the Loop",
    author: "Harrison Chase",
    date: "July 25, 2026",
    readTime: "9 min",
    featured: true,
    coverGradient: "from-[#001133] to-[#0A0A0A]",
    toc: [
      { id: "off-the-shelf", title: "Off-the-shelf intelligence does not know your business" },
      { id: "what-it-means", title: "What it means to own your intelligence" },
      { id: "checklist", title: "A checklist for owning your intelligence" },
      { id: "strategic-choice", title: "The strategic choice" }
    ],
    content: `
      <div class="mb-12">
        <h2 class="text-[24px] font-bold mb-4">Key Takeaways</h2>
        <ul class="list-disc pl-6 space-y-2 text-[#0066FF] font-medium">
          <li><span class="text-gray-700 font-normal">Generic AI alone will not create lasting advantage</span></li>
          <li><span class="text-gray-700 font-normal">Companies need control over their models, agent systems, context, and memory</span></li>
          <li><span class="text-gray-700 font-normal">Owning intelligence also means managing its cost, quality, risk and behavior</span></li>
          <li><span class="text-gray-700 font-normal">Advantage comes from a feedback loop that improves the system with use</span></li>
          <li><span class="text-gray-700 font-normal">Buy the generic infrastructure, but own the intelligence that compounds</span></li>
        </ul>
      </div>
      <p class="text-[18px] leading-relaxed text-gray-700 mb-8">Over the next five years, every company will use AI in one of two ways: to run critical parts of their business, or as part of the product they sell to customers. In both cases, generic intelligence will not be enough.</p>
      <p class="text-[18px] leading-relaxed text-gray-700 mb-12">To have real impact, companies need to own their intelligence. Ownership does not mean building every layer from scratch. It means controlling the parts that determine how intelligence behaves, how it's managed, and whether it compounds over time.</p>
      <h2 id="off-the-shelf" class="text-[32px] font-bold text-black mt-16 mb-6 tracking-tight leading-tight">Off-the-shelf intelligence does not know your business</h2>
      <p class="text-[18px] leading-relaxed text-gray-700 mb-6">Off-the-shelf AI is useful because it is general. It can answer common questions and reason across a broad set of topics. This makes it helpful to get started. But to assume that generic intelligence can run operations inside a company would be a gross simplification.</p>
      <h2 id="what-it-means" class="text-[32px] font-bold text-black mt-16 mb-6 tracking-tight leading-tight">What it means to own your intelligence</h2>
      <p class="text-[18px] leading-relaxed text-gray-700 mb-6">Owning your intelligence does not mean building every layer of the AI stack yourself. It means controlling the critical parts - the parts that determine how intelligence behaves, what it learns from, how much it costs, and whether it improves over time.</p>
      <h2 id="checklist" class="text-[32px] font-bold text-black mt-16 mb-6 tracking-tight leading-tight">A checklist for owning your intelligence</h2>
      <p class="text-[18px] leading-relaxed text-gray-700 mb-6">Do you truly own your intelligence? Here are a set of questions you should be asking yourself to determine that:</p>
      <ul class="list-disc pl-6 mb-8 text-[18px] text-gray-700 space-y-4">
        <li>If a brand new model provider launched a SOTA model tomorrow, could you easily switch to it?</li>
        <li>If the current model provider you're using deprecates a model - could you host it yourself to avoid any disruption?</li>
      </ul>
      <h2 id="strategic-choice" class="text-[32px] font-bold text-black mt-16 mb-6 tracking-tight leading-tight">The strategic choice</h2>
      <p class="text-[18px] leading-relaxed text-gray-700 mb-6">Companies do not need to build every layer of the AI stack. They should buy the parts that are hard, generic, and undifferentiated.</p>
    `
  },
  {
    slug: "introducing-langsmith-tuned-evaluators",
    title: "Introducing LangSmith Tuned Evaluators, starting with Perceived Error",
    excerpt: "A new standard for scoring agent performance and policy adherence.",
    category: "Observability & Evals",
    author: "J. Broekhuizen, S. Karkhanis",
    date: "August 18, 2026",
    readTime: "5 min",
    featured: false,
    coverGradient: "from-[#3D5A12] to-[#121A05]",
    toc: [{ id: "intro", title: "Introduction" }],
    content: `<h2 id="intro" class="text-[32px] font-bold text-black mt-10 mb-6">Introduction</h2><p class="text-[18px] leading-relaxed text-gray-700 mb-6">How do you know if an agent did a "good" job? Standard accuracy metrics fail when evaluating open-ended, complex tasks. Enter Tuned Evaluators.</p>`
  },
  {
    slug: "langsmith-llm-gateway",
    title: "LangSmith LLM Gateway: runtime controls for production agents",
    excerpt: "Runtime controls for production agents.",
    category: "Deployment",
    author: "M. Janicki, R. Petgrave",
    date: "July 30, 2026",
    readTime: "7 min",
    featured: false,
    coverGradient: "from-[#6A324A] to-[#1F0F16]",
    toc: [{ id: "gateway", title: "The Gateway" }],
    content: `<h2 id="gateway" class="text-[32px] font-bold text-black mt-10 mb-6">The Gateway</h2><p class="text-[18px] leading-relaxed text-gray-700 mb-6">By routing all model calls through the Gateway, we implemented real-time spend tracking per agent identity.</p>`
  },
  {
    slug: "langchain-nvidia-nemoclaw",
    title: "LangChain and NVIDIA launch the NemoClaw Deep Agents Blueprint",
    excerpt: "Launch the NemoClaw Deep Agents Blueprint.",
    category: "Partner",
    author: "The LangChain Team",
    date: "July 8, 2026",
    readTime: "7 min",
    featured: false,
    coverGradient: "from-[#0F2A3D] to-[#040C12]",
    toc: [{ id: "blueprint", title: "The Blueprint" }],
    content: `<h2 id="blueprint" class="text-[32px] font-bold text-black mt-10 mb-6">The Blueprint</h2><p class="text-[18px] leading-relaxed text-gray-700 mb-6">A blueprint for scaling deep agents securely.</p>`
  },
  {
    slug: "connections-managed-credentials",
    title: "Connections: Managed credentials and per-caller identity for Managed Deep Agents",
    excerpt: "Managed credentials and per-caller identity for Managed Deep Agents.",
    category: "Deep Agents",
    author: "Victor Moreira",
    date: "September 9, 2026",
    readTime: "8 min",
    featured: false,
    coverGradient: "from-[#3D5A12] to-[#121A05]",
    toc: [{ id: "identity", title: "Identity" }],
    content: `<h2 id="identity" class="text-[32px] font-bold text-black mt-10 mb-6">Identity</h2><p class="text-[18px] leading-relaxed text-gray-700 mb-6">Secure credential management for autonomous agents.</p>`
  },
  {
    slug: "organizing-context-multi-agent",
    title: "Organizing Context in a Multi-Agent Harness",
    excerpt: "How to manage state and security policies across dozens of communicating AI agents.",
    category: "Agent Architecture",
    author: "T. Bengre, C. Curme",
    date: "September 8, 2026",
    readTime: "6 min",
    featured: false,
    coverGradient: "from-[#1F2C44] to-[#0A0E16]",
    toc: [{ id: "stateless", title: "Stateless Delegation" }],
    content: `<h2 id="stateless" class="text-[32px] font-bold text-black mt-10 mb-6">Stateless Delegation</h2><p class="text-[18px] leading-relaxed text-gray-700 mb-6">Instead of passing API keys, pass cryptographic intent tokens.</p>`
  },
  {
    slug: "mcp-stateless-protocol",
    title: "MCP in LangChain: Stateless Protocol, Elicitation, and More!",
    excerpt: "A deep dive into our new Managed Context Protocol for securing LLM payloads.",
    category: "Open Source",
    author: "Sydney Runkle",
    date: "September 3, 2026",
    readTime: "5 min",
    featured: false,
    coverGradient: "from-[#0F2A3D] to-[#040C12]",
    toc: [{ id: "intro", title: "Introduction to MCP" }],
    content: `<h2 id="intro" class="text-[32px] font-bold text-black mt-10 mb-6">Introduction to MCP</h2><p class="text-[18px] leading-relaxed text-gray-700 mb-6">The Managed Context Protocol (MCP) defines how an agent proves its authorization.</p>`
  },
  {
    slug: "agents-that-pay",
    title: "Agents That Pay | How Nevermined Empowers LangChain Agents to Buy and Sell Services",
    excerpt: "Agents that can buy and sell services.",
    category: "Partner",
    author: "J. Wadinski, R. Marques",
    date: "September 3, 2026",
    readTime: "12 min",
    featured: false,
    coverGradient: "from-[#0F2A3D] to-[#040C12]",
    toc: [{ id: "intro", title: "Intro" }],
    content: `<h2 id="intro" class="text-[32px] font-bold text-black mt-10 mb-6">Intro</h2><p class="text-[18px] leading-relaxed text-gray-700 mb-6">Empowering agents with economic agency.</p>`
  },
  {
    slug: "scaling-agents-europe",
    title: "Scaling Agents in Europe & The Middle East: Lessons from Schneider Electric, Vodafone, and monday.com",
    excerpt: "Scaling agents globally.",
    category: "Conceptual Guide",
    author: "Jess Ou",
    date: "September 3, 2026",
    readTime: "17 min",
    featured: false,
    coverGradient: "from-[#1F2C44] to-[#0A0E16]",
    toc: [{ id: "intro", title: "Intro" }],
    content: `<h2 id="intro" class="text-[32px] font-bold text-black mt-10 mb-6">Intro</h2><p class="text-[18px] leading-relaxed text-gray-700 mb-6">Lessons learned from global deployments.</p>`
  },
  {
    slug: "august-2026-newsletter",
    title: "August 2026: LangChain Newsletter",
    excerpt: "What's new at LangChain",
    category: "Newsletter",
    author: "The LangChain Team",
    date: "August 26, 2026",
    readTime: "4 min",
    featured: false,
    coverGradient: "from-[#4AA8FF] to-[#122A40]",
    toc: [{ id: "updates", title: "Updates" }],
    content: `<h2 id="updates" class="text-[32px] font-bold text-black mt-10 mb-6">Updates</h2><p class="text-[18px] leading-relaxed text-gray-700 mb-6">Monthly updates.</p>`
  }
];

export const allCategories = [
  "Agent Architecture", "Case Studies", "Company Announcements", "Conceptual Guide",
  "Deep Agents", "Deployment", "Engineering", "Harrison's In the Loop",
  "Aegisora Labs", "Newsletter", "Observability & Evals", "Open Source", "Partner"
];
