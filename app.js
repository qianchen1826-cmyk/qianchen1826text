const state = {
  answers: {},
  queue: [],
  current: 0,
  identity: null,
  report: null,
  filter: "全部",
  redemptionId: null,
  resultToken: null,
  resultExpiresAt: null,
  attempt: null,
};

const baseQuestions = [
  {
    id: "age",
    label: "年龄阶段",
    title: "你现在处在哪个年龄阶段？",
    helper: "年龄不会决定你适合什么，只用来让后续场景更贴近你的生活。",
    options: [
      { value: "18-20", text: "18—20 岁", detail: "大一到大二，开始了解自己能做什么" },
      { value: "21-23", text: "21—23 岁", detail: "大三大四、应届或刚毕业不久" },
      { value: "24-27", text: "24—27 岁", detail: "已经工作一段时间，正在调整方向" },
      { value: "28-35", text: "28—35 岁", detail: "有稳定工作或正在重新规划生活" },
      { value: "36+", text: "36 岁以上", detail: "希望把经验、资源或兴趣变成新的可能" },
    ],
  },
  {
    id: "identity",
    label: "当前身份",
    title: "下面哪种状态最接近你现在的生活？",
    helper: "请选择最像你现在的那个，不需要选择别人期待的答案。",
    options: [
      { value: "student", text: "大三、大四学生", detail: "开始认真考虑毕业后做什么" },
      { value: "new-graduate", text: "应届或毕业两年内", detail: "还没有稳定方向或正在找工作" },
      { value: "employed-side", text: "有稳定工作，想增加副业", detail: "不一定离开主业，想多一条收入线" },
      { value: "switcher", text: "想跳槽或转行", detail: "对当前工作不满意，准备换方向" },
      { value: "freedom", text: "不想继续上班，想试自由职业", detail: "希望逐步拥有更自主的工作方式" },
      { value: "unclear", text: "还说不清楚，只想先找到方向", detail: "信息看了很多，但还没真正试过" },
    ],
  },
  {
    id: "goal",
    label: "当前目标",
    title: "你现在最希望这次测评帮你解决什么？",
    helper: "选最急迫的一件事，结果会围绕它安排建议。",
    options: [
      { value: "career", text: "判断毕业后适合什么工作", detail: "想减少盲目投递和试错" },
      { value: "side-income", text: "找到一条可开始的副业", detail: "先增加一点收入或验证可能性" },
      { value: "skill", text: "找到值得长期练的技能", detail: "不想一直追着短期项目跑" },
      { value: "switch", text: "为跳槽或转行做准备", detail: "希望把已有经验迁移出去" },
      { value: "freedom", text: "逐渐摆脱固定上班模式", detail: "想建立更自主的工作方式" },
      { value: "first-feedback", text: "先赚到或获得第一次真实反馈", detail: "不想再只收藏教程和项目" },
    ],
  },
  {
    id: "time",
    label: "现实时间",
    title: "接下来一个月，你每周能稳定投入多少时间？",
    helper: "请按下班、上课、通勤和家庭安排之后的真实时间估计。",
    options: [
      { value: "2-4", text: "2—4 小时", detail: "只能用碎片时间慢慢试" },
      { value: "5-8", text: "5—8 小时", detail: "可以固定安排两三个时段" },
      { value: "9-15", text: "9—15 小时", detail: "愿意认真推进一个方向" },
      { value: "15+", text: "15 小时以上", detail: "近期可以投入较多精力" },
    ],
  },
  {
    id: "budget",
    label: "启动边界",
    title: "为了验证一个新方向，你现在能接受多少启动成本？",
    helper: "这不是在判断你有没有钱，而是确定推荐是否符合你的安全边界。",
    options: [
      { value: "zero", text: "最好 0 元", detail: "先用现有设备和免费工具验证" },
      { value: "small", text: "50 元以内", detail: "可以为工具或小素材付一点钱" },
      { value: "medium", text: "50—300 元", detail: "前提是用途透明、能先试再买" },
      { value: "higher", text: "300 元以上", detail: "愿意投入，但需要清楚的回报逻辑" },
    ],
  },
];

const branchQuestions = {
  student: [
    {
      id: "student-major",
      label: "学生分流",
      title: "你对自己的专业和未来工作的关系，最接近哪种感觉？",
      options: [
        { value: "fit", text: "专业方向还不错，想继续深挖", score: { organizer: 1, workflow: 1 } },
        { value: "uncertain", text: "不讨厌，但不知道能做什么工作", score: { portfolio: 2, explorer: 1 } },
        { value: "mismatch", text: "专业和我想做的事差得比较远", score: { content: 1, visual: 1, explorer: 2 } },
        { value: "none", text: "基本没想过，先把毕业解决再说", score: { executor: 1, explorer: 2 } },
      ],
    },
    {
      id: "student-proof",
      label: "学生分流",
      title: "除了课程作业，你手上最接近“作品或经历”的东西是什么？",
      options: [
        { value: "club", text: "社团、学生会、校园活动或公众号内容", score: { content: 2, connector: 1 } },
        { value: "project", text: "比赛、课程项目、毕业设计或实验室经历", score: { workflow: 1, portfolio: 2 } },
        { value: "help", text: "帮同学、朋友或家人做过图片、文案、表格、剪辑", score: { visual: 1, content: 1, executor: 1 } },
        { value: "none", text: "还没有能拿出来展示的东西", score: { explorer: 2, portfolio: 1 } },
      ],
    },
    {
      id: "student-choice",
      label: "学生分流",
      title: "如果毕业后先做一份普通工作，你更希望它给你什么？",
      options: [
        { value: "stable", text: "稳定收入和清晰的成长路径", score: { executor: 2, organizer: 1 } },
        { value: "skill", text: "可以快速积累一项专业技能", score: { workflow: 1, portfolio: 2 } },
        { value: "freedom", text: "有一定自由度，不被固定流程困住", score: { content: 1, visual: 1, explorer: 1 } },
        { value: "income", text: "薪资和成长上限更重要", score: { connector: 1, workflow: 1 } },
      ],
    },
    {
      id: "student-action",
      label: "学生分流",
      title: "如果给你 7 天准备一个求职或副业样例，你愿意先做什么？",
      options: [
        { value: "sort", text: "把一类资料、工具或案例整理成清单", score: { organizer: 2 } },
        { value: "write", text: "写一组内容、商品文案或短视频脚本", score: { content: 2 } },
        { value: "make", text: "做几张图、一个页面或一条短视频", score: { visual: 2, portfolio: 1 } },
        { value: "talk", text: "找真实的人聊需求，争取做一个小任务", score: { connector: 2 } },
      ],
    },
    {
      id: "student-decision",
      label: "学生分流",
      title: "面对“考研、考公、就业、做项目”几个选择，你最容易卡在哪里？",
      options: [
        { value: "info", text: "信息太多，不知道怎么比较", score: { organizer: 2, explorer: 1 } },
        { value: "confidence", text: "担心自己能力不够，迟迟不敢开始", score: { portfolio: 2, explorer: 1 } },
        { value: "family", text: "家人意见和自己的想法不太一致", score: { executor: 1, connector: 1 } },
        { value: "action", text: "知道该做什么，但总是拖到最后", score: { executor: -1, explorer: 2 } },
      ],
    },
  ],
  "new-graduate": [
    {
      id: "graduate-status",
      label: "毕业分流",
      title: "你最近的真实状态更接近哪一种？",
      options: [
        { value: "search", text: "正在投简历，但方向比较散", score: { explorer: 2, organizer: 1 } },
        { value: "offer", text: "有工作或 offer，但还在犹豫要不要去", score: { executor: 1, explorer: 1 } },
        { value: "gap", text: "暂时没有稳定安排，想先做点事情", score: { executor: 1, content: 1 } },
        { value: "side", text: "已经工作，但想增加一条收入线", score: { organizer: 1, connector: 1 } },
      ],
    },
    {
      id: "graduate-strength",
      label: "毕业分流",
      title: "别人最可能因为哪件事来找你帮忙？",
      options: [
        { value: "organize", text: "整理资料、找信息、做表格", score: { organizer: 2 } },
        { value: "write", text: "改文字、想标题、做表达", score: { content: 2 } },
        { value: "visual", text: "做图、剪视频、排版", score: { visual: 2 } },
        { value: "communicate", text: "沟通协调、找人、推进事情", score: { connector: 2 } },
      ],
    },
    {
      id: "graduate-try",
      label: "毕业分流",
      title: "你现在更需要哪种证明，才能放心继续走下去？",
      options: [
        { value: "money", text: "第一次真实收入", score: { connector: 1, executor: 1 } },
        { value: "work", text: "一份能放进简历的作品", score: { portfolio: 2, visual: 1 } },
        { value: "feedback", text: "业内人的真实反馈", score: { connector: 1, explorer: 1 } },
        { value: "routine", text: "连续完成一件事的信心", score: { executor: 2 } },
      ],
    },
    {
      id: "graduate-work",
      label: "毕业分流",
      title: "如果先进入一家公司，你更想用哪种方式积累筹码？",
      options: [
        { value: "specialty", text: "把一个岗位技能练到能独立交付", score: { workflow: 1, executor: 2 } },
        { value: "content", text: "做出可公开展示的内容或案例", score: { content: 1, portfolio: 2 } },
        { value: "network", text: "认识更多行业里的人和机会", score: { connector: 2 } },
        { value: "observe", text: "先观察公司流程，找到效率问题", score: { organizer: 1, workflow: 2 } },
      ],
    },
    {
      id: "graduate-block",
      label: "毕业分流",
      title: "你现在最怕的不是失败，而是下面哪件事？",
      options: [
        { value: "wrong", text: "走错方向，浪费一两年", score: { organizer: 1, explorer: 2 } },
        { value: "empty", text: "简历空空的，证明不了自己", score: { portfolio: 2 } },
        { value: "income", text: "收入太低，生活压力顶不住", score: { connector: 1, executor: 1 } },
        { value: "stuck", text: "进入一份工作后就很难离开", score: { freedom: 1, workflow: 1 } },
      ],
    },
  ],
  "employed-side": [
    {
      id: "work-task",
      label: "副业分流",
      title: "你在主业里，哪类任务最常被交给你？",
      options: [
        { value: "data", text: "表格、资料、流程和细节检查", score: { organizer: 2, workflow: 1 } },
        { value: "content", text: "写材料、做汇报、对外表达", score: { content: 2 } },
        { value: "visual", text: "做图、剪视频、包装和呈现", score: { visual: 2 } },
        { value: "client", text: "客户沟通、销售、协调和推进", score: { connector: 2 } },
      ],
    },
    {
      id: "work-energy",
      label: "副业分流",
      title: "下班后你的真实精力，更像哪种情况？",
      options: [
        { value: "碎片", text: "只剩零碎时间，不适合长时间专注", score: { organizer: 1, content: 1 } },
        { value: "fixed", text: "每周能固定拿出两三个晚上", score: { executor: 1, workflow: 1 } },
        { value: "weekend", text: "工作日很累，但周末能集中做事", score: { visual: 1, portfolio: 1 } },
        { value: "enough", text: "目前精力还可以，愿意认真投入", score: { connector: 1, workflow: 1 } },
      ],
    },
    {
      id: "side-relation",
      label: "副业分流",
      title: "你希望副业和主业是什么关系？",
      options: [
        { value: "same", text: "最好相关，顺便把工作经验变现", score: { workflow: 1, executor: 1 } },
        { value: "different", text: "完全不同，给自己留一条退路", score: { content: 1, visual: 1 } },
        { value: "low-profile", text: "尽量不影响主业，也不想被同事知道", score: { organizer: 1, executor: 1 } },
        { value: "future", text: "希望以后逐渐替代主业", score: { connector: 1, portfolio: 1 } },
      ],
    },
    {
      id: "side-income",
      label: "副业分流",
      title: "如果副业做起来，你希望先达到什么结果？",
      options: [
        { value: "small", text: "每月多几百元，先证明可行", score: { executor: 1, organizer: 1 } },
        { value: "one-two", text: "每月多一两千元，能持续就好", score: { connector: 1, content: 1 } },
        { value: "skill", text: "积累一个未来能换工作的技能", score: { portfolio: 1, workflow: 1 } },
        { value: "replace", text: "最终建立能替代主业的收入", score: { connector: 2, portfolio: 1 } },
      ],
    },
    {
      id: "side-boundary",
      label: "副业分流",
      title: "关于主业和副业的边界，你目前最需要注意什么？",
      options: [
        { value: "time", text: "不能占用工作时间或影响交付", score: { executor: 1 } },
        { value: "conflict", text: "不能和公司业务、客户或资源冲突", score: { organizer: 1, executor: 1 } },
        { value: "energy", text: "不能让自己长期透支", score: { organizer: 1 } },
        { value: "none", text: "暂时没有明显限制", score: { connector: 1, workflow: 1 } },
      ],
    },
  ],
  switcher: [
    {
      id: "switch-reason",
      label: "转行分流",
      title: "你想离开当前工作，最主要的原因是什么？",
      options: [
        { value: "pay", text: "薪资和回报不匹配", score: { connector: 1, workflow: 1 } },
        { value: "content", text: "工作内容让我越来越没兴趣", score: { content: 1, visual: 1 } },
        { value: "growth", text: "看不到成长或晋升空间", score: { portfolio: 1, workflow: 1 } },
        { value: "life", text: "强度、通勤或生活方式不适合", score: { organizer: 1, freedom: 1 } },
      ],
    },
    {
      id: "switch-transfer",
      label: "转行分流",
      title: "你最希望把现在工作里的哪项能力带走？",
      options: [
        { value: "process", text: "流程、数据、项目管理", score: { organizer: 1, workflow: 2 } },
        { value: "expression", text: "表达、写作、汇报和内容", score: { content: 2 } },
        { value: "visual", text: "设计、包装、呈现和审美", score: { visual: 2 } },
        { value: "people", text: "客户、资源、谈判和推进", score: { connector: 2 } },
      ],
    },
    {
      id: "switch-proof",
      label: "转行分流",
      title: "如果目标岗位今天就要看证据，你手上最缺什么？",
      options: [
        { value: "portfolio", text: "没有对口作品或项目案例", score: { portfolio: 2 } },
        { value: "skill", text: "技能会一点，但还不能独立交付", score: { executor: 1, workflow: 1 } },
        { value: "story", text: "经历不少，但不会讲清楚自己的价值", score: { content: 1, connector: 1 } },
        { value: "target", text: "还没选定具体岗位和行业", score: { explorer: 2, organizer: 1 } },
      ],
    },
    {
      id: "switch-transition",
      label: "转行分流",
      title: "你能给自己留下多长的转向准备期？",
      options: [
        { value: "now", text: "现在就要找，不能等待太久", score: { executor: 1, organizer: 1 } },
        { value: "three", text: "可以准备 1—3 个月", score: { portfolio: 2 } },
        { value: "six", text: "可以准备 3—6 个月", score: { workflow: 1, portfolio: 1 } },
        { value: "slow", text: "没有明确期限，先把能力练起来", score: { explorer: 1, workflow: 1 } },
      ],
    },
    {
      id: "switch-start",
      label: "转行分流",
      title: "你更愿意用哪种方式验证目标方向？",
      options: [
        { value: "sample", text: "先做 2—3 个小作品", score: { portfolio: 2, visual: 1 } },
        { value: "part-time", text: "接一个小任务或兼职项目", score: { connector: 2 } },
        { value: "interview", text: "先访谈几位业内人士", score: { connector: 1, organizer: 1 } },
        { value: "course", text: "先系统学习一段时间", score: { workflow: 1, executor: 1 } },
      ],
    },
  ],
  freedom: [
    {
      id: "freedom-why",
      label: "自由职业分流",
      title: "你不想继续传统上班，最真实的原因是什么？",
      options: [
        { value: "time", text: "想掌握时间，不想每天被固定打卡牵着走", score: { organizer: 1, freedom: 1 } },
        { value: "meaning", text: "想做更有成就感、能看到结果的事", score: { portfolio: 1, content: 1 } },
        { value: "ceiling", text: "觉得收入和成长被岗位限制住了", score: { connector: 1, workflow: 1 } },
        { value: "burnout", text: "只是累了，想先找一个出口", score: { explorer: 2, executor: -1 } },
      ],
    },
    {
      id: "freedom-service",
      label: "自由职业分流",
      title: "如果要独立接一类服务，你最愿意交付什么？",
      options: [
        { value: "organize", text: "整理、文档、表格或信息", score: { organizer: 2 } },
        { value: "content", text: "文字、脚本、内容和表达", score: { content: 2 } },
        { value: "visual", text: "图片、视频、设计和包装", score: { visual: 2 } },
        { value: "client", text: "咨询、沟通、推广或资源撮合", score: { connector: 2 } },
      ],
    },
    {
      id: "freedom-client",
      label: "自由职业分流",
      title: "你对主动找客户的真实接受度是？",
      options: [
        { value: "avoid", text: "不太想找，希望通过平台或内容被看见", score: { content: 1, visual: 1 } },
        { value: "text", text: "可以文字沟通，但不想频繁打电话", score: { organizer: 1, content: 1 } },
        { value: "okay", text: "可以说明服务、报价和交付范围", score: { executor: 1, connector: 1 } },
        { value: "like", text: "我喜欢认识人，谈需求会让我有动力", score: { connector: 2 } },
      ],
    },
    {
      id: "freedom-runway",
      label: "自由职业分流",
      title: "如果收入有波动，你目前能接受怎样的过渡？",
      options: [
        { value: "side", text: "先保留主业或稳定收入，再慢慢试", score: { organizer: 1, executor: 1 } },
        { value: "short", text: "可以承受 1—3 个月的不确定", score: { portfolio: 1, connector: 1 } },
        { value: "long", text: "有储备，可以认真搭建半年", score: { workflow: 1, connector: 1 } },
        { value: "none", text: "没有储备，只是很想离开现在的状态", score: { explorer: 2 } },
      ],
    },
    {
      id: "freedom-routine",
      label: "自由职业分流",
      title: "没有人催你时，你最容易出现哪种情况？",
      options: [
        { value: "plan", text: "我会自己定计划并完成", score: { executor: 2 } },
        { value: "deadline", text: "有截止时间就能做，没人催会拖", score: { executor: 0, organizer: 1 } },
        { value: "interest", text: "感兴趣的事会投入，不感兴趣就很难动", score: { content: 1, visual: 1 } },
        { value: "lost", text: "容易失去方向，需要外部反馈", score: { explorer: 2 } },
      ],
    },
  ],
  unclear: [
    {
      id: "unclear-help",
      label: "探索分流",
      title: "过去一年，别人最常因为什么来找你？",
      options: [
        { value: "info", text: "帮忙找资料、查信息、做比较", score: { organizer: 2 } },
        { value: "write", text: "帮忙写东西、润色、想表达方式", score: { content: 2 } },
        { value: "make", text: "帮忙做图、剪视频或处理页面", score: { visual: 2 } },
        { value: "connect", text: "帮忙联系别人、协调事情、解决问题", score: { connector: 2 } },
      ],
    },
    {
      id: "unclear-proud",
      label: "探索分流",
      title: "哪一类完成后的结果，最容易让你觉得“这事做得还行”？",
      options: [
        { value: "clear", text: "一堆混乱信息变得清清楚楚", score: { organizer: 2 } },
        { value: "read", text: "别人看完我的文字后真的理解了", score: { content: 2 } },
        { value: "beautiful", text: "普通素材被我做得好看、有重点", score: { visual: 2 } },
        { value: "done", text: "原本卡住的事情被我推进完成", score: { connector: 2, executor: 1 } },
      ],
    },
    {
      id: "unclear-test",
      label: "探索分流",
      title: "如果只给你 7 天试一个方向，你最愿意先做什么？",
      options: [
        { value: "list", text: "做一份工具、资料或案例清单", score: { organizer: 2 } },
        { value: "content", text: "写 3 篇内容或 5 个商品介绍", score: { content: 2 } },
        { value: "visual", text: "做 3 张图或 2 条短视频", score: { visual: 2 } },
        { value: "task", text: "找一个真实的人，完成一个小需求", score: { connector: 2 } },
      ],
    },
    {
      id: "unclear-overload",
      label: "探索分流",
      title: "你收藏了很多项目或教程，却还没开始，最像下面哪种原因？",
      options: [
        { value: "compare", text: "每个都想比较，迟迟选不出来", score: { organizer: 1, explorer: 2 } },
        { value: "fear", text: "担心做不好，宁愿继续准备", score: { portfolio: 1, explorer: 2 } },
        { value: "time", text: "确实没有稳定时间，生活优先级太多", score: { executor: -1, organizer: 1 } },
        { value: "bad", text: "以前试过，但项目本身不靠谱", score: { organizer: 1, connector: 1 } },
      ],
    },
    {
      id: "unclear-preference",
      label: "探索分流",
      title: "如果不考虑别人眼光，你更想拥有哪种工作感受？",
      options: [
        { value: "order", text: "安静、清楚、一个人也能完成", score: { organizer: 2, executor: 1 } },
        { value: "expression", text: "表达、创作、让别人看见我的想法", score: { content: 2 } },
        { value: "craft", text: "动手做出具体作品，看得见变化", score: { visual: 2 } },
        { value: "people", text: "认识人、解决问题、让事情往前走", score: { connector: 2 } },
      ],
    },
  ],
};

const commonQuestions = [
  {
    id: "ability-mess",
    label: "能力追问",
    title: "别人交给你一件说不太清楚的事，你通常会先做什么？",
    options: [
      { value: "questions", text: "先追问目标、对象、格式和截止时间", score: { connector: 2, organizer: 1 } },
      { value: "example", text: "先找一个类似案例，照着拆出结构", score: { organizer: 1, visual: 1, portfolio: 1 } },
      { value: "draft", text: "先做一个粗版本，再让对方看方向", score: { executor: 2, visual: 1 } },
      { value: "wait", text: "等对方说得更清楚，否则不太敢动手", score: { explorer: 1, executor: -1 } },
    ],
  },
  {
    id: "ability-create",
    label: "能力追问",
    title: "下面哪一种产出最容易让你进入状态？",
    options: [
      { value: "structure", text: "表格、清单、流程图或分类后的资料", score: { organizer: 2, workflow: 1 } },
      { value: "words", text: "标题、文案、脚本或一段讲清楚的话", score: { content: 2 } },
      { value: "visual", text: "图片、视频、页面或视觉包装", score: { visual: 2 } },
      { value: "solution", text: "一次沟通、一次协调或一个被解决的问题", score: { connector: 2 } },
    ],
  },
  {
    id: "ability-tool",
    label: "能力追问",
    title: "遇到重复、麻烦、耗时的步骤，你会有什么反应？",
    options: [
      { value: "optimize", text: "想办法用表格、模板、AI 或自动化减少重复", score: { workflow: 2, organizer: 1 } },
      { value: "repeat", text: "先按要求做完，稳定比折腾工具重要", score: { executor: 2 } },
      { value: "delegate", text: "想办法找人协作或拆分给别人", score: { connector: 2 } },
      { value: "avoid", text: "如果一直重复，我很快就会失去兴趣", score: { content: 1, visual: 1, explorer: 1 } },
    ],
  },
  {
    id: "ability-feedback",
    label: "能力追问",
    title: "你做出的第一版没有人点赞、咨询或认可时，你更可能怎么做？",
    options: [
      { value: "change", text: "检查标题、展示方式和目标对象，再改一版", score: { content: 1, organizer: 1 } },
      { value: "more", text: "再做几份不同版本，比较哪份反馈更好", score: { visual: 1, portfolio: 2 } },
      { value: "ask", text: "找一个懂行的人问具体问题", score: { connector: 2 } },
      { value: "stop", text: "先停下来，怀疑自己是不是不适合", score: { explorer: 2, executor: -1 } },
    ],
  },
];

const resourceQuestions = [
  {
    id: "device",
    label: "现实资源",
    title: "你目前最方便使用的设备条件是？",
    options: [
      { value: "phone", text: "主要用手机", tag: "手机可做" },
      { value: "basic-computer", text: "手机和普通电脑都能用", tag: "电脑可做" },
      { value: "good-computer", text: "有性能不错的电脑和常用软件", tag: "适合制作" },
      { value: "offline", text: "设备一般，但有本地、人脉或行业资源", tag: "资源驱动" },
    ],
  },
  {
    id: "communication",
    label: "沟通边界",
    title: "你对和陌生人沟通、介绍服务的接受程度是？",
    options: [
      { value: "low", text: "尽量少沟通，最好独立完成", tag: "低沟通" },
      { value: "text", text: "可以文字沟通，不想频繁打电话", tag: "文字沟通" },
      { value: "okay", text: "可以确认需求、报价和交付", tag: "可交付" },
      { value: "high", text: "喜欢认识人，谈合作会让我有动力", tag: "沟通驱动" },
    ],
  },
];

const projects = [
  { id: "organize", type: "AI办公", title: "AI办公提效与工具应用", description: "用 AI 工具、办公软件和现成模板，减少重复操作，提升整理、写作、表格和汇报效率。", tags: ["AI办公", "低成本", "电脑可做"], risk: "先核验工具" },
  { id: "copy", type: "内容增长", title: "内容选题、文案与 IP 增长", description: "围绕选题、标题、脚本和个人 IP，做出能发布、能复盘的内容样例。", tags: ["内容增长", "文字服务", "可远程"], risk: "先做样例" },
  { id: "visual", type: "短视频视觉", title: "短视频与视觉内容制作", description: "用图片、剪辑、素材和基础包装制作短视频、封面或宣传内容。", tags: ["短视频", "作品驱动", "不必露脸"], risk: "注意版权" },
  { id: "workflow", type: "AI自动化", title: "AI 智能体与自动化流程", description: "把重复任务拆成步骤，借助智能体、自动化或模板跑通一条可复用流程。", tags: ["AI自动化", "可积累", "电脑可做"], risk: "需要学习" },
  { id: "local", type: "商家运营", title: "实体商家与电商运营", description: "围绕门店、平台店铺或服务商家，完成内容、获客、运营和复盘。", tags: ["商家运营", "沟通驱动", "可复购"], risk: "先明确交付" },
  { id: "portfolio", type: "知识产品", title: "知识付费与课程产品", description: "把经验、课程、案例或方法整理成课程、资料包或知识产品。", tags: ["知识付费", "作品驱动", "长期积累"], risk: "需要持续投入" },
  { id: "support", type: "业务交付", title: "具体业务获客与交付", description: "围绕陪诊、服务、客户沟通等明确场景，完成获客、跟进和交付。", tags: ["真实需求", "可交付", "需核验"], risk: "先确认规则" },
  { id: "affiliate", type: "引流转化", title: "引流、转化与虚拟产品", description: "通过内容、平台渠道或虚拟产品测试流量和转化，先核验规则与成本。", tags: ["引流转化", "虚拟产品", "规则敏感"], risk: "先核验规则" },
];

const roleMeta = {
  organizer: { title: "AI办公提效师", share: "把办公中的重复和混乱变简单的人", color: "#0b8066", projects: ["organize", "support", "workflow"], skills: ["信息整理", "工具应用", "任务拆解"] },
  content: { title: "内容增长策划师", share: "把内容做成能被看见和传播的作品", color: "#b76838", projects: ["copy", "affiliate", "visual"], skills: ["选题表达", "受众意识", "内容迭代"] },
  visual: { title: "短视频视觉创作者", share: "用画面和视频把想法变得更有吸引力", color: "#8766a8", projects: ["visual", "organize", "copy"], skills: ["画面审美", "剪辑包装", "作品呈现"] },
  workflow: { title: "AI自动化流程师", share: "用智能体和自动化把复杂流程跑通", color: "#3e7aa4", projects: ["workflow", "organize", "support"], skills: ["流程拆分", "AI工具", "效率优化"] },
  connector: { title: "引流成交运营师", share: "从平台和渠道找到需求并推动成交", color: "#bb6b2b", projects: ["affiliate", "local", "copy"], skills: ["需求理解", "渠道运营", "转化推进"] },
  executor: { title: "实体商家运营师", share: "把具体业务按标准稳定落地并交付", color: "#477857", projects: ["local", "support", "affiliate"], skills: ["业务执行", "客户跟进", "稳定交付"] },
  portfolio: { title: "知识产品设计师", share: "把经验和方法做成可展示的知识产品", color: "#a15366", projects: ["portfolio", "copy", "affiliate"], skills: ["案例提炼", "课程设计", "产品呈现"] },
  explorer: { title: "副业项目探索者", share: "用低成本试跑找到更适合自己的项目", color: "#6f7a5b", projects: ["affiliate", "portfolio", "visual"], skills: ["方向比较", "低成本试错", "复盘选择"] },
};

const stageMeta = {
  student: { title: "职业探索期", advice: "先用作品、实习和小项目验证方向，不急着给自己下最终结论。" },
  "new-graduate": { title: "方向落地期", advice: "把“我想做”变成一份能展示的作品或一次真实反馈，再决定下一步。" },
  "employed-side": { title: "副业增量期", advice: "优先选择不影响主业、能在固定时间完成的服务，不要把自己安排到透支。" },
  switcher: { title: "转行准备期", advice: "把已有经验迁移到目标岗位，用案例证明能力，再开始更精准地投递。" },
  freedom: { title: "自由职业验证期", advice: "先保留安全垫，用小服务验证客户来源，不建议突然裸辞或先交大额费用。" },
  unclear: { title: "低成本试跑期", advice: "停止继续收藏，挑一个 7 天能完成的方向，用反馈替代想象。" },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const ATTEMPT_KEY = "tryout-attempt-v2";
const PENDING_KEY = "tryout-redemption-v2";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let redeemBusy = false;
let savePromise = null;
let lookupBusy = false;
let resourceLoadVersion = 0;

function readStored(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function writeStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

function isReport(report) {
  const strings = ["stage", "stageAdvice", "title", "share", "paragraph", "identity", "goal"];
  const arrays = ["tags", "skills", "evidence", "risks", "projectIds"];
  return Boolean(report && Object.hasOwn(roleMeta, report.role)
    && Number.isFinite(report.confidence) && report.confidence >= 0 && report.confidence <= 100
    && strings.every((key) => typeof report[key] === "string" && report[key].length < 10000)
    && arrays.every((key) => Array.isArray(report[key]) && report[key].length <= 30
      && report[key].every((value) => typeof value === "string" && value.length < 10000))
    && report.evidence.length >= 3);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function persistAttempt() {
  if (!state.attempt) return;
  state.attempt.answers = state.answers;
  state.attempt.current = state.current;
  if (!writeStored(ATTEMPT_KEY, state.attempt)) {
    showToast("浏览器无法保存进度，请先保存结果长图，并允许本站使用本地存储。");
  }
  updateResumeButton();
}

function updateResumeButton() {
  const button = $("#resume-button");
  button.hidden = !state.attempt;
  button.textContent = state.attempt?.report ? "查看本机上次结果" : "继续上次答题";
}

function selected(id) {
  const question = [...baseQuestions, ...(branchQuestions[state.identity] || []), ...commonQuestions, ...resourceQuestions].find((item) => item.id === id);
  const value = state.answers[id];
  return question && value !== undefined ? question.options.find((option) => option.value === value) : null;
}

function buildQueue() {
  state.queue = [...baseQuestions];
  state.identity = state.answers.identity;
  if (state.identity && branchQuestions[state.identity]) state.queue.push(...branchQuestions[state.identity]);
  state.queue.push(...commonQuestions, ...resourceQuestions);
}

function renderQuestion() {
  buildQueue();
  const question = state.queue[state.current];
  if (!question) return;
  const selectedIndex = question.options.findIndex((option) => option.value === state.answers[question.id]);
  const completed = state.queue.filter((item) => state.answers[item.id] !== undefined).length;
  $("#question-count").textContent = `第 ${state.current + 1} / ${state.queue.length} 题`;
  $("#progress-label").textContent = question.label;
  $("#progress-bar").style.width = `${Math.max(7, (completed / state.queue.length) * 100)}%`;
  $("#question-area").innerHTML = `
    <div class="question-kicker">${question.label}</div>
    <h2 class="question-title">${question.title}</h2>
    <p class="question-helper">${question.helper || "没有标准答案，请按照你过去三个月的真实情况选择。"}</p>
    <div class="options-grid">
      ${question.options.map((option, index) => `
        <button class="option-button ${selectedIndex === index ? "selected" : ""}" data-option="${index}" type="button">
          <span><b>${String.fromCharCode(65 + index)}.</b> ${option.text}<small>${option.detail || ""}</small></span>
        </button>
      `).join("")}
    </div>
  `;
  $$(".option-button").forEach((button) => button.addEventListener("click", () => {
    state.answers[question.id] = question.options[Number(button.dataset.option)].value;
    persistAttempt();
    renderQuestion();
  }));
  $("#prev-button").disabled = state.current === 0;
  $("#next-button").textContent = state.current === state.queue.length - 1 ? "生成我的报告 →" : "下一题 →";
}

function addScore(target, score) {
  Object.entries(score || {}).forEach(([key, value]) => { target[key] = (target[key] || 0) + value; });
}

function calculateScores() {
  const scores = Object.fromEntries(Object.keys(roleMeta).map((key) => [key, 0]));
  state.queue.forEach((question) => {
    const option = selected(question.id);
    if (option?.score) addScore(scores, option.score);
  });
  const answerText = Object.values(state.answers).map((index) => index).join("-");
  if (!answerText || Object.values(scores).every((score) => score === 0)) scores.explorer = 3;
  return scores;
}

function getStage() {
  const identity = state.answers.identity || "unclear";
  return stageMeta[identity] || stageMeta.unclear;
}

function getTags() {
  const tags = [];
  const time = selected("time");
  const budget = selected("budget");
  const device = selected("device");
  const communication = selected("communication");
  if (time) tags.push(`每周 ${time.text.replace("小时", "h")}`);
  if (budget?.value === "zero") tags.push("0 元优先");
  if (device?.tag) tags.push(device.tag);
  if (communication?.tag) tags.push(communication.tag);
  if (state.answers.identity === "student") tags.push("学生阶段");
  if (state.answers.identity === "switcher") tags.push("目标岗位导向");
  return tags.slice(0, 4);
}

function evidenceForRole(role, scores) {
  const best = [...Object.entries(scores)].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const evidenceMap = {
    organizer: ["你在整理信息、比较工具和拆解办公任务时更容易进入状态", "你更看重把事情做清楚、做稳，再用工具提升效率", "你适合从 AI 办公、表格处理和模板应用这类明确产出开始"],
    content: ["你对“怎么说别人更容易理解和愿意继续看”比较敏感", "你愿意通过修改标题、脚本和展示方式寻找更好的反馈", "你适合从内容选题、IP 增长和短视频表达这样的产出开始"],
    visual: ["你更容易从看得见的图片、视频和页面作品里获得反馈", "你对画面、排版、重点和呈现方式有直觉", "你适合先做出几个视觉样例，再逐步增加工具和题材"],
    workflow: ["你会注意重复劳动，也愿意研究智能体、工具和自动化", "你能把一件事拆成步骤，并寻找可复用的流程", "你适合把 AI 工具能力转化成能落地的自动化方案"],
    connector: ["你不只是愿意沟通，还会继续追问流量、客户和成交真正卡在哪里", "你能在渠道、需求、转化和交付之间推进事情", "你适合从平台引流、获客和转化类项目开始验证"],
    executor: ["你更看重按约定完成，把具体业务真正落地", "你适合标准明确、可以持续跟进和交付的商家或服务项目", "你的优势需要通过真实客户、连续执行和稳定反馈被看见"],
    portfolio: ["你现在最需要的不是继续证明“我想做”，而是拿出“我做过”的知识产品", "你对课程、案例、资料包和真实反馈的需求高于泛泛学习", "你适合用短周期作品建立知识付费或个人 IP 的筹码"],
    explorer: ["你的回答没有显示出单一项目方向压倒性领先", "这更像是项目很多、真实试跑还不够，而不是你没有能力", "你需要用一个低成本的虚拟产品或 AI 项目实验替代继续等待确定答案"],
  };
  const direction = role === "explorer" ? evidenceMap.explorer : evidenceMap[best[0]?.[0]] || evidenceMap[role];
  return direction;
}

function buildReport() {
  const scores = calculateScores();
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topScore = ranked[0][1];
  const secondScore = ranked[1][1];
  const role = topScore - secondScore <= 1 ? "explorer" : ranked[0][0];
  const meta = roleMeta[role];
  const stage = getStage();
  const tags = getTags();
  const confidence = Math.min(96, Math.max(68, 71 + Math.max(0, topScore - secondScore) * 4));
  const evidence = evidenceForRole(role, scores);
  const identity = selected("identity")?.text || "当前阶段";
  const goal = selected("goal")?.text || "寻找方向";
  const time = selected("time")?.text || "有限时间";
  const budget = selected("budget")?.text || "谨慎投入";
  const paragraph = `你目前是“${identity}”，最想解决的是“${goal}”。从回答看，你更容易在${evidence[0].replace("你", "")}。结合你每周可投入${time.replace("小时", "小时")}、启动成本偏好为“${budget}”，你现在最适合先做一个小而具体的验证，而不是同时追多个项目。`;
  const risks = [];
  if (state.answers.budget === "zero") risks.push("不要在没有看见交付内容前购买高价课程或资料包");
  if (state.answers.communication === "low") risks.push("优先选低沟通项目，先用作品或平台入口获得反馈");
  if (state.answers.time === "2-4") risks.push("不要选择需要每天连续投入的项目");
  if (state.answers.identity === "student" || state.answers.identity === "new-graduate") risks.push("不要把一个测试结果当成最终职业结论");
  if (!risks.length) risks.push("先明确服务范围、时间和交付标准，再接受任务");
  if (state.answers.identity === "freedom") risks.push("不建议在没有储备和客户验证前突然裸辞");
  return {
    role, stage: stage.title, stageAdvice: stage.advice, title: meta.title, share: meta.share,
    confidence, tags, skills: meta.skills, evidence, paragraph, risks: risks.slice(0, 3),
    goal, identity, projectIds: meta.projects, scores,
  };
}

function safeResourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch { return null; }
}

function renderReportProjects(report, resources = []) {
  const configuredBySlot = new Map(resources.map((resource) => [Number(resource.slot), resource]));
  const items = report.projectIds.slice(0, 3).map((projectId, index) => {
    const project = projects.find((item) => item.id === projectId);
    const resource = configuredBySlot.get(index + 1);
    return { project, resource, url: safeResourceUrl(resource?.resource_url) };
  }).filter((item) => item.project);
  $("#secondary-results").innerHTML = items.map(({ project, resource, url }) => `
    <article class="secondary-card"><div class="recommendation-top"><div><p class="eyebrow">${escapeHtml(project.type)}</p><h3>${escapeHtml(resource?.title || project.title)}</h3></div><span class="project-risk">${escapeHtml(project.risk)}</span></div><p>${escapeHtml(resource?.description || project.description)}</p><div class="tag-row">${project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>${url
      ? `<div class="resource-actions"><a class="text-action resource-open-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">打开百度网盘资料 →</a>${resource.access_code ? `<button class="resource-code-button" data-resource-code="${escapeHtml(resource.access_code)}" type="button">复制提取码 ${escapeHtml(resource.access_code)}</button>` : ""}</div>`
      : `<button class="text-action" data-project="${escapeHtml(project.id)}" type="button">资料暂未启用</button>`}</article>
  `).join("");
  $("#secondary-results").querySelectorAll("[data-project]").forEach((button) => button.addEventListener("click", () => showToast("该结果的资料链接尚未在后台启用。")));
  $("#secondary-results").querySelectorAll("[data-resource-code]").forEach((button) => button.addEventListener("click", async () => {
    try { await copyText(button.dataset.resourceCode); showToast("提取码已复制。"); }
    catch (error) { showToast(error.message); }
  }));
}

function renderMoreProjectsResource(resource) {
  const section = $("#more-projects-section");
  const url = safeResourceUrl(resource?.resource_url);
  if (!resource || !url) {
    section.hidden = true;
    section.innerHTML = "";
    return;
  }
  section.innerHTML = `
    <div class="more-projects-copy"><p class="eyebrow">MORE OPTIONS</p><h2>${escapeHtml(resource.title)}</h2><p>${escapeHtml(resource.description)}</p></div>
    <div class="more-projects-actions"><a class="primary-button" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(resource.button_label)}</a>${resource.access_code ? `<button class="resource-code-button" data-extra-resource-code="${escapeHtml(resource.access_code)}" type="button">复制提取码 ${escapeHtml(resource.access_code)}</button>` : ""}</div>
  `;
  section.hidden = false;
  section.querySelector("[data-extra-resource-code]")?.addEventListener("click", async (event) => {
    try { await copyText(event.currentTarget.dataset.extraResourceCode); showToast("提取码已复制。"); }
    catch (error) { showToast(error.message); }
  });
}

async function loadResultResources(report) {
  const version = ++resourceLoadVersion;
  const supabaseClient = window.getSupabaseClient?.();
  if (!supabaseClient) return;
  try {
    const [resourcesResult, extraResult] = await Promise.all([
      supabaseClient.from("result_resources")
        .select("slot,project_id,title,description,resource_url,access_code")
        .eq("result_role", report.role)
        .eq("is_enabled", true)
        .order("slot", { ascending: true }),
      supabaseClient.from("report_extra_resources")
        .select("title,description,button_label,resource_url,access_code")
        .eq("resource_key", "more-projects")
        .eq("is_enabled", true)
        .maybeSingle(),
    ]);
    if (version === resourceLoadVersion && state.report === report) {
      if (resourcesResult.error) console.warn("Result resources unavailable:", resourcesResult.error.message || resourcesResult.error);
      else renderReportProjects(report, resourcesResult.data || []);
      if (extraResult.error) console.warn("Extra report resource unavailable:", extraResult.error.message || extraResult.error);
      else renderMoreProjectsResource(extraResult.data);
    }
  } catch (error) {
    console.warn("Result resources unavailable:", error.message || error);
  }
}

function renderReport(report = state.report) {
  if (!isReport(report)) { showToast("报告数据不完整，无法显示。"); return; }
  state.report = report;
  const meta = roleMeta[report.role];
  $("#primary-result").innerHTML = `
    <div class="recommendation-top"><div><p class="eyebrow">你的结果 · ${escapeHtml(report.stage)}</p><h2>${escapeHtml(report.title)}</h2><p class="share-line">${escapeHtml(report.share)}</p></div><div class="match-score"><strong>${report.confidence}</strong><small>匹配度</small></div></div>
    <div class="tag-row">${report.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
    <p class="result-paragraph">${escapeHtml(report.paragraph)}</p>
    <div class="recommendation-meta"><div><span>你的阶段</span><strong>${escapeHtml(report.stage)}</strong></div><div><span>建议起点</span><strong>先完成一个样例</strong></div><div><span>推荐数量</span><strong>最多 3 个方向</strong></div></div>
  `;
  $("#evidence-grid").innerHTML = `
    <article class="evidence-card"><span class="evidence-label">你已经掌握的能力</span><h3>${report.skills.map(escapeHtml).join(" · ")}</h3><p>${escapeHtml(report.evidence[1])}</p></article>
    <article class="evidence-card"><span class="evidence-label">为什么这样判断</span><h3>${escapeHtml(report.identity)} → ${escapeHtml(report.goal)}</h3><p>${escapeHtml(report.evidence[0])}。${escapeHtml(report.evidence[2])}。</p></article>
    <article class="evidence-card"><span class="evidence-label">理论提示</span><h3>兴趣 × 能力 × 现实资源</h3><p>这不是给你贴死标签，而是把职业兴趣、可迁移能力、自我效能和当前资源放在一起，寻找现在最容易迈出的那一步。</p></article>
  `;
  renderReportProjects(report);
  renderMoreProjectsResource(null);
  loadResultResources(report);
  $("#profile-summary").innerHTML = report.tags.map((tag, index) => `<div class="profile-item"><div><span>${["当前状态", "可用时间", "启动边界", "沟通方式"][index] || "现实标签"}</span><strong>${escapeHtml(tag)}</strong></div><div class="profile-track"><b style="width:${Math.max(48, report.confidence - index * 7)}%"></b></div></div>`).join("");
  $("#risk-list").innerHTML = report.risks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("");
  renderDays(report);
  updateResultControls();
}

function renderDays(report) {
  const plans = {
    organizer: ["选定一个主题", "收集 10 条公开资料", "整理成一页清单", "补充来源和使用说明", "找一位朋友试用", "根据反馈修改", "保存成可展示样例"],
    content: ["选一个真实商品", "拆 5 个优秀标题", "写出 3 个版本", "做成可展示样例", "请朋友指出不清楚处", "发布一条真实内容", "记录反馈和下一步"],
    visual: ["选定一个工具", "模仿 3 个优秀案例", "完成第一张样图", "完成第二份不同题材", "整理 3 个作品", "询问一个真实需求", "复盘耗时和反馈"],
    workflow: ["找到一个重复流程", "画出当前步骤", "用模板或 AI 做简化", "跑通第一版", "记录节省的时间", "请一人试用", "整理成说明文档"],
    connector: ["列出 10 个潜在需求", "观察对方正在缺什么", "准备三句话服务说明", "联系 3 个可能对象", "确认一个小需求", "完成一次小交付", "记录沟通和复购可能"],
    executor: ["选择一个明确任务", "写清交付标准", "做出第一版", "检查细节和格式", "请人按标准验收", "按反馈修改", "整理交付模板"],
    portfolio: ["确定一个目标岗位", "拆解岗位要求", "选一个真实案例", "完成第一版作品", "补充过程和结果", "找人给出反馈", "整理成作品集页面"],
    explorer: ["只选一个方向", "完成一份最小样例", "记录实际耗时", "请一人真实试用", "观察自己是否愿意继续", "修改一个问题", "决定继续、调整或换方向"],
  };
  const key = report.role in plans ? report.role : "explorer";
  const days = plans[key];
  const keyName = `tryout-days-${state.resultToken || state.redemptionId || report.role}`;
  const stored = readStored(keyName, []);
  const done = Array.isArray(stored) ? [...new Set(stored.filter((day) => Number.isInteger(day) && day >= 0 && day < 7))] : [];
  $("#day-grid").innerHTML = days.map((title, index) => `
    <article class="day-card ${done.includes(index) ? "done" : ""}" data-day="${index}"><div class="day-head"><span class="day-label">DAY ${index + 1}</span><span class="day-check">${done.includes(index) ? "✓" : "○"}</span></div><strong>${title}</strong><p>${index === 0 ? escapeHtml(report.stageAdvice) : "完成后记一句真实反馈，别只记录收藏了什么。"}</p></article>
  `).join("");
  updateCompletion(done);
  $$(".day-card").forEach((card) => card.addEventListener("click", () => {
    const day = Number(card.dataset.day);
    const current = done;
    const next = current.includes(day) ? current.filter((item) => item !== day) : [...current, day];
    if (!writeStored(keyName, next)) showToast("浏览器无法保存打卡记录。");
    renderDays(report);
  }));
}

function updateCompletion(done) {
  $("#completion-label").textContent = `${done.length} / 7 已完成`;
  $("#run-progress-bar").style.width = `${(done.length / 7) * 100}%`;
}

function renderProjects(filter = state.filter) {
  const visible = projects.filter((project) => filter === "全部" || project.tags.includes(filter) || project.type === filter);
  $("#project-grid").innerHTML = visible.map((project) => `
    <article class="project-card"><div class="project-card-top"><span class="project-type">${project.type}</span><span class="risk-pill">${project.risk}</span></div><h3>${project.title}</h3><p>${project.description}</p><div class="project-card-meta">${project.tags.map((tag) => `<span>${tag}</span>`).join("")}</div><button class="text-action" data-project="${project.id}">了解试跑边界 →</button></article>
  `).join("");
$$(".text-action").forEach((button) => button.addEventListener("click", () => showToast("具体资料入口和百度网盘链接将在后台配置后开放。")));
}

function showView(name) {
  $$(".view").forEach((view) => view.classList.toggle("active-view", view.id === `${name}-view`));
  $$(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.nav === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetTest() {
  state.answers = {};
  state.queue = [];
  state.current = 0;
  state.identity = null;
  state.report = null;
  state.resultToken = null;
  state.resultExpiresAt = null;
  setResultSaveStatus("");
  renderQuestion();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function createRequestId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function setResultSaveStatus(message, tone = "") {
  const status = $("#result-save-status");
  if (!status) return;
  status.textContent = message;
  status.className = `result-save-status ${tone}`.trim();
}

function openModal(id) {
  const modal = $(`#${id}`);
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => modal.querySelector("input")?.focus(), 50);
}

function closeModals() {
  $$(".modal-backdrop").forEach((modal) => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  });
}

async function redeemCode(code, requestId) {
  const supabaseClient = window.getSupabaseClient?.();
  if (!supabaseClient) throw new Error("网站还没有配置 Supabase，请联系管理员。");
  const { data, error } = await supabaseClient.rpc("redeem_access_code", { p_code: code, p_request_id: requestId });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

async function redeemNewAttempt(code) {
  let pending = readStored(PENDING_KEY);
  if (pending && pending.code !== code) {
    throw new Error("上次验证尚未确认，请先使用原测评码重试，避免重复扣次。");
  }
  if (!pending || !UUID_PATTERN.test(pending.requestId)) pending = { code, requestId: createRequestId() };
  if (!writeStored(PENDING_KEY, pending)) {
    throw new Error("浏览器无法保存验证记录，请允许本站使用本地存储后再开始。");
  }
  const requestId = pending.requestId;
  const result = await redeemCode(code, requestId);
  if (!result) { localStorage.removeItem(PENDING_KEY); return null; }
  if (!UUID_PATTERN.test(result.redemption_id)) throw new Error("核销返回异常，请联系管理员。");
  activateAttempt(code, requestId, result);
  localStorage.removeItem(PENDING_KEY);
  return result;
}

function activateAttempt(code, requestId, result) {
  const attempt = { code, requestId, redemptionId: result.redemption_id, answers: {}, current: 0, report: null };
  if (!writeStored(ATTEMPT_KEY, attempt)) throw new Error("进度保存失败，请使用相同测评码重试。");
  state.attempt = attempt;
  state.redemptionId = result.redemption_id;
  resetTest();
  updateResumeButton();
}

function restoreAttempt() {
  if (lookupBusy || redeemBusy) { showToast("正在处理请求，请稍候再恢复进度。"); return; }
  const attempt = state.attempt;
  if (!attempt) return;
  state.answers = attempt.answers;
  buildQueue();
  state.current = Math.max(0, Math.min(Number.isInteger(attempt.current) ? attempt.current : 0, state.queue.length - 1));
  state.redemptionId = attempt.redemptionId;
  state.resultToken = attempt.resultToken || null;
  state.resultExpiresAt = attempt.expiresAt || null;
  if (isReport(attempt.report)) {
    renderReport(attempt.report);
    showView("result");
    if (!state.resultToken) saveAssessmentResult();
  } else {
    state.report = null;
    renderQuestion();
    showView("quiz");
  }
  closeModals();
}

function rpcMessage(error) {
  if (["PGRST202", "PGRST203", "42883"].includes(error.code)) {
    return "服务尚未升级，请联系管理员完成数据库更新。";
  }
  return error.message || "连接失败，请检查网络后重试。";
}

async function verifyCode() {
  if (redeemBusy || lookupBusy) return;
  const input = $("#access-code");
  const code = input.value.trim().toUpperCase();
  const error = $("#code-error");
  error.textContent = "";
  if (!code) { error.textContent = "请输入测评码。"; return; }
  if (savePromise) { error.textContent = "正在保存上次结果，请稍候。"; return; }
  if (state.attempt?.code === code) { restoreAttempt(); return; }
  if (state.attempt?.report && !state.attempt.resultToken) {
    error.textContent = "上次结果尚未保存到云端，请先查看本机上次结果并重试保存。"; return;
  }
  redeemBusy = true;
  $("[data-action='verify-code']").disabled = true;
  try {
    const result = await redeemNewAttempt(code);
    if (!result) {
      error.textContent = "测评码无效或测试次数已用完。";
      return;
    }
  } catch (requestError) {
    error.textContent = rpcMessage(requestError);
    return;
  } finally {
    redeemBusy = false;
    $("[data-action='verify-code']").disabled = false;
  }
  closeModals();
  history.replaceState(null, "", window.location.pathname + window.location.search);
  showView("quiz");
}

function encodeShare(data) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function updateResultControls() {
  const own = state.attempt?.report === state.report;
  const saved = Boolean(state.resultToken);
  $("#result-token").textContent = state.resultToken || "尚未取得查询码";
  $("[data-action='copy-result-key']").disabled = !saved;
  $("[data-action='retry-save']").hidden = !own || saved;
  $("[data-action='restart']").disabled = !own || Boolean(savePromise) || redeemBusy;
  if (saved) {
    const expired = Date.parse(state.resultExpiresAt) <= Date.now();
    const date = new Date(state.resultExpiresAt).toLocaleString("zh-CN");
    setResultSaveStatus(expired
      ? "云端结果已过期，本机仍可查看和保存长图。"
      : `结果已保存至云端，有效期至 ${date}。请保管测评码和结果查询码。`, expired ? "warning" : "success");
  } else {
    setResultSaveStatus(own ? "报告已保存在本机，等待上传云端。" : "这是旧版分享结果，可保存长图；没有云端查询码。", "warning");
  }
}

async function saveAssessmentResult() {
  if (savePromise) return savePromise;
  const attempt = state.attempt;
  if (!attempt?.report || attempt.report !== state.report || attempt.resultToken) return Boolean(attempt?.resultToken);
  savePromise = Promise.resolve().then(async () => {
    setResultSaveStatus("报告已保存在本机，正在上传云端…");
    $("[data-action='retry-save']").disabled = true;
    $("[data-action='restart']").disabled = true;
    try {
      const supabaseClient = window.getSupabaseClient?.();
      if (!supabaseClient) throw new Error("网站尚未配置云端服务。");
      const { data, error } = await supabaseClient.rpc("save_assessment_result", {
        p_redemption_id: attempt.redemptionId, p_code: attempt.code,
        p_request_id: attempt.requestId, p_payload: attempt.report,
      });
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      if (!UUID_PATTERN.test(result?.result_token) || !Number.isFinite(Date.parse(result?.expires_at))) {
        throw new Error("云端返回的数据异常，请重试保存。");
      }
      attempt.resultToken = result.result_token;
      attempt.expiresAt = result.expires_at;
      const persisted = writeStored(ATTEMPT_KEY, attempt);
      const days = readStored(`tryout-days-${attempt.redemptionId}`, []);
      writeStored(`tryout-days-${result.result_token}`, days);
      if (state.report === attempt.report) {
        state.resultToken = result.result_token;
        state.resultExpiresAt = result.expires_at;
        updateResultControls();
        renderDays(attempt.report);
        if (!persisted) setResultSaveStatus("结果已保存到云端，但本机记录更新失败。请立即复制并保管查询码。", "warning");
      }
      return true;
    } catch (error) {
      if (state.report === attempt.report) setResultSaveStatus(`云端保存未完成：${rpcMessage(error)} 本机报告已保留，可点击重试保存。`, "warning");
      return false;
    } finally {
      $("[data-action='retry-save']").disabled = false;
      $("[data-action='restart']").disabled = state.attempt?.report !== state.report;
      savePromise = null;
    }
  });
  return savePromise;
}

async function lookupResult() {
  if (lookupBusy || savePromise || redeemBusy) return;
  const code = $("#lookup-code").value.trim().toUpperCase();
  const token = $("#lookup-token").value.trim().toLowerCase();
  const message = $("#lookup-error");
  message.textContent = "";
  if (!code || !UUID_PATTERN.test(token)) { message.textContent = "请输入测评码和完整的结果查询码。"; return; }
  lookupBusy = true;
  $("[data-action='lookup-result']").disabled = true;
  try {
    const supabaseClient = window.getSupabaseClient?.();
    if (!supabaseClient) throw new Error("网站尚未配置云端服务。");
    const { data, error } = await supabaseClient.rpc("get_assessment_result", { p_code: code, p_result_token: token });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result || Date.parse(result.expires_at) <= Date.now()) { message.textContent = "未找到有效结果，请核对测评码和查询码；云端结果保存 7 天。"; return; }
    if (!isReport(result.payload) || !Number.isFinite(Date.parse(result.expires_at))) throw new Error("报告数据不完整，请联系管理员。");
    state.redemptionId = null;
    state.resultToken = token;
    state.resultExpiresAt = result.expires_at;
    renderReport(result.payload);
    closeModals();
    showView("result");
  } catch (error) { message.textContent = rpcMessage(error); }
  finally { lookupBusy = false; $("[data-action='lookup-result']").disabled = false; }
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    if (!copied) throw new Error("复制失败，请手动选择并复制。");
  }
}

function decodeShare(value) {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch {
    return null;
  }
}

async function copyResultLink() {
  if (!state.report) return;
  if (state.attempt?.report === state.report && !state.resultToken) await saveAssessmentResult();
  if (state.resultToken) {
    const url = `${window.location.href.split("#")[0]}#result=${state.resultToken}`;
    try { await copyText(url); showToast("查询链接已复制，打开后仍需输入测评码。"); }
    catch (error) { showToast(error.message); }
    return;
  }
  if (state.attempt?.report === state.report) { showToast("请先完成云端保存，也可以先保存结果长图。"); return; }
  const data = { ...state.report, savedAt: new Date().toISOString() };
  const url = `${window.location.href.split("#")[0]}#report=${encodeShare(data)}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast("结果链接已复制，可以发给朋友。");
  } catch {
    const area = document.createElement("textarea");
    area.value = url;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    showToast("结果链接已复制，可以发给朋友。");
  }
}

function wrapText(ctx, text, maxWidth) {
  const chars = [...text];
  const lines = [];
  let line = "";
  chars.forEach((char) => {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = char; } else line = test;
  });
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function drawLines(ctx, text, x, y, maxWidth, lineHeight, color = "#6e7b80", font = "24px Microsoft YaHei") {
  ctx.font = font;
  ctx.fillStyle = color;
  const lines = wrapText(ctx, text, maxWidth);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function saveResultImage() {
  if (!state.report) return;
  const report = state.report;
  const meta = roleMeta[report.role];
  const canvas = document.createElement("canvas");
  const width = 1200;
  const height = 1860;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f5f8f5";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#123a36";
  ctx.fillRect(0, 0, width, 260);
  ctx.fillStyle = "#b7e2d0";
  ctx.font = "22px Microsoft YaHei";
  ctx.fillText("副业试跑站 · 方向报告", 72, 72);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px Microsoft YaHei";
  ctx.fillText(meta.title, 72, 150);
  ctx.font = "26px Microsoft YaHei";
  ctx.fillStyle = "#f4c76b";
  ctx.fillText(`${report.stage}  ·  ${report.confidence} 匹配度`, 72, 205);
  roundRect(ctx, 60, 300, 1080, 320, 18, "#ffffff");
  ctx.fillStyle = "#0b8066";
  ctx.font = "bold 30px Microsoft YaHei";
  ctx.fillText(report.share, 92, 360);
  drawLines(ctx, report.paragraph, 92, 415, 990, 38, "#4a5b56", "24px Microsoft YaHei");
  ctx.fillStyle = "#0b8066";
  ctx.font = "bold 25px Microsoft YaHei";
  ctx.fillText("你已经掌握的能力", 72, 700);
  drawLines(ctx, report.skills.join(" · "), 72, 748, 1030, 35, "#172126", "bold 28px Microsoft YaHei");
  ctx.fillStyle = "#0b8066";
  ctx.font = "bold 25px Microsoft YaHei";
  ctx.fillText("现实标签", 72, 850);
  drawLines(ctx, report.tags.join("  ·  "), 72, 900, 1030, 35, "#172126", "25px Microsoft YaHei");
  ctx.fillStyle = "#0b8066";
  ctx.font = "bold 25px Microsoft YaHei";
  ctx.fillText("为什么这样判断", 72, 1000);
  drawLines(ctx, `${report.evidence[0]}。${report.evidence[1]}。${report.evidence[2]}。`, 72, 1048, 1030, 37, "#4a5b56", "23px Microsoft YaHei");
  ctx.fillStyle = "#0b8066";
  ctx.font = "bold 25px Microsoft YaHei";
  ctx.fillText("推荐先试", 72, 1270);
  const recommended = report.projectIds.map((id) => projects.find((project) => project.id === id)?.title).filter(Boolean);
  drawLines(ctx, recommended.join("  ·  "), 72, 1318, 1030, 36, "#172126", "bold 26px Microsoft YaHei");
  ctx.fillStyle = "#0b8066";
  ctx.font = "bold 25px Microsoft YaHei";
  ctx.fillText("7 天行动提醒", 72, 1415);
  const plan = {
    organizer: "把一个主题整理成可使用的清单",
    content: "完成 3 个真实内容样例",
    visual: "完成 3 个视觉或视频样例",
    workflow: "把一个重复流程做成模板",
    connector: "完成一次真实需求沟通和小交付",
    executor: "按明确标准完成一个稳定交付",
    portfolio: "围绕目标岗位完成一份作品",
    explorer: "完成一个低成本最小样例",
  }[report.role];
  drawLines(ctx, plan, 72, 1463, 1030, 36, "#172126", "bold 26px Microsoft YaHei");
  ctx.fillStyle = "#7e8d87";
  ctx.font = "20px Microsoft YaHei";
  ctx.fillText("本报告用于自我探索和低风险尝试，不构成收益承诺。", 72, 1770);
  ctx.fillText("副业试跑站 · 先试 7 天，再决定要不要继续", 72, 1815);
  const link = document.createElement("a");
  link.download = `副业试跑站-${meta.title}-方向报告.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast("长图已生成，手机端可在下载/文件中保存到相册。");
}

function loadSharedReport() {
  const token = window.location.hash.match(/^#result=([0-9a-f-]+)$/i)?.[1];
  if (token && UUID_PATTERN.test(token)) {
    $("#lookup-token").value = token;
    openModal("lookup-modal");
    return true;
  }
  const value = window.location.hash.match(/^#report=(.+)$/)?.[1];
  if (!value) {
    if (window.location.hash) { showToast("结果链接无效，请使用测评码和查询码查询。"); return true; }
    return false;
  }
  const report = decodeShare(value);
  if (!isReport(report)) { showToast("结果链接无效或数据不完整。"); return true; }
  state.redemptionId = null;
  state.resultToken = null;
  state.resultExpiresAt = null;
  renderReport(report);
  showView("result");
  return true;
}

$$("[data-nav]").forEach((element) => element.addEventListener("click", (event) => {
  event.preventDefault();
  const target = element.dataset.nav;
  if (target === "projects") renderProjects();
  showView(target);
}));

$$("[data-action='start']").forEach((button) => button.addEventListener("click", () => openModal("code-modal")));
$$("[data-action='resume']").forEach((button) => button.addEventListener("click", restoreAttempt));
$$("[data-action='lookup-history']").forEach((button) => button.addEventListener("click", () => openModal("lookup-modal")));
$$("[data-action='lookup-result']").forEach((button) => button.addEventListener("click", lookupResult));
$$("[data-action='retry-save']").forEach((button) => button.addEventListener("click", saveAssessmentResult));
$$("[data-action='copy-result-key']").forEach((button) => button.addEventListener("click", async () => {
  if (!state.resultToken) return;
  try { await copyText(state.resultToken); showToast("结果查询码已复制，请和测评码一起保管。"); }
  catch (error) { showToast(error.message); }
}));
$("#lookup-token").addEventListener("keydown", (event) => { if (event.key === "Enter") lookupResult(); });
$("#lookup-code").addEventListener("keydown", (event) => { if (event.key === "Enter") lookupResult(); });
$$("[data-action='verify-code']").forEach((button) => button.addEventListener("click", verifyCode));
$$("[data-action='close-modal']").forEach((button) => button.addEventListener("click", closeModals));
$$(".modal-backdrop").forEach((modal) => modal.addEventListener("click", (event) => { if (event.target === modal) closeModals(); }));
$("#access-code").addEventListener("keydown", (event) => { if (event.key === "Enter") verifyCode(); });

$("#prev-button").addEventListener("click", () => {
  if (state.current > 0) { state.current -= 1; persistAttempt(); renderQuestion(); }
});

$("#next-button").addEventListener("click", () => {
  const question = state.queue[state.current];
  if (state.answers[question.id] === undefined) {
    $("#question-area").animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 180 });
    showToast("先选择一个最符合你的答案。");
    return;
  }
  if (state.current < state.queue.length - 1) {
    state.current += 1;
    persistAttempt();
    renderQuestion();
  } else {
    const report = buildReport();
    if (!state.attempt) { showToast("请先输入测评码开始答题。"); return; }
    state.attempt.report = report;
    persistAttempt();
    renderReport(report);
    showView("result");
    saveAssessmentResult();
  }
});

$$("[data-action='restart']").forEach((button) => button.addEventListener("click", async () => {
  if (redeemBusy || savePromise || lookupBusy || state.attempt?.report !== state.report) return;
  if (!state.attempt.resultToken) { showToast("请先重试保存当前结果，再开始新测评。"); return; }
  if (!window.confirm("再测一次会消耗该测评码的 1 次机会。请先保管当前结果查询码，确定继续吗？")) return;
  redeemBusy = true;
  $("[data-action='restart']").disabled = true;
  try {
    const result = await redeemNewAttempt(state.attempt.code);
    if (!result) throw new Error("当前测评码次数已用完，请使用新的测评码。");
    history.replaceState(null, "", window.location.pathname + window.location.search);
    showView("quiz");
  } catch (error) { showToast(rpcMessage(error)); }
  finally { redeemBusy = false; $("[data-action='restart']").disabled = false; }
}));
$$("[data-action='quit']").forEach((button) => button.addEventListener("click", () => showView("home")));
$$("[data-action='save-image']").forEach((button) => button.addEventListener("click", saveResultImage));
$$("[data-action='copy-link']").forEach((button) => button.addEventListener("click", copyResultLink));
$$("[data-action='feedback']").forEach((button) => button.addEventListener("click", () => openModal("feedback-modal")));

$$(".filter-button").forEach((button) => button.addEventListener("click", () => {
  state.filter = button.dataset.filter;
  $$(".filter-button").forEach((item) => item.classList.toggle("active", item === button));
  renderProjects();
}));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModals();
});

renderQuestion();
renderProjects();
const storedAttempt = readStored(ATTEMPT_KEY);
if (storedAttempt && typeof storedAttempt.code === "string"
  && UUID_PATTERN.test(storedAttempt.requestId) && UUID_PATTERN.test(storedAttempt.redemptionId)
  && storedAttempt.answers && typeof storedAttempt.answers === "object"
  && !Array.isArray(storedAttempt.answers)
  && (!storedAttempt.report || isReport(storedAttempt.report))) {
  const allQuestions = [...baseQuestions, ...Object.values(branchQuestions).flat(), ...commonQuestions, ...resourceQuestions];
  storedAttempt.answers = Object.fromEntries(Object.entries(storedAttempt.answers).filter(([id, value]) =>
    allQuestions.some((question) => question.id === id && question.options.some((option) => option.value === value))));
  if (!UUID_PATTERN.test(storedAttempt.resultToken) || !Number.isFinite(Date.parse(storedAttempt.expiresAt))) {
    delete storedAttempt.resultToken;
    delete storedAttempt.expiresAt;
  }
  state.attempt = storedAttempt;
}
updateResumeButton();
if (!loadSharedReport() && state.attempt) restoreAttempt();
