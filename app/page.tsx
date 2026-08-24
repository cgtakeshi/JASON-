"use client";

import { useEffect, useMemo, useState } from "react";
import works from "./portfolio-manifest.json";
import ScrubbedHeroVideo from "../components/ScrubbedHeroVideo";
import { COPY, interpolate, projectLabel, tagLabel, workTitle, type Locale } from "./portfolio-i18n";

const asset = (path: string) => path.startsWith("/") ? `.${path}` : path;

const projects = [
  { no:"01", subtitleZh:"十二星座英雄", subtitleEn:"MATCH-3 RPG", type:"ART DIRECTION / UI / CHARACTER", image:"/zodiac-cover.png", folder:"Zodiac Heroes" },
  { no:"02", subtitleZh:"开放世界 RPG", subtitleEn:"OPEN-WORLD RPG", type:"ART DIRECTION / PIPELINE", image:"/cover-youxing.jpg", folder:"悠星大陆" },
  { no:"03", subtitleZh:"和风 MOBA", subtitleEn:"MOBILE MOBA", type:"CHARACTER / CONCEPT", image:"/cover-paj.png", folder:"决战平安京" },
  { no:"04", subtitleZh:"国风回合制手游", subtitleEn:"TURN-BASED MOBILE RPG", type:"CHARACTER / ILLUSTRATION", image:"/cover-dhsy.png", folder:"大话西游手游" },
  { no:"05", subtitleZh:"国风回合制端游", subtitleEn:"TURN-BASED ONLINE RPG", type:"CONCEPT / ILLUSTRATION", image:"/cover-dhpc.jpg", folder:"大话西游端游" },
  { no:"06", subtitleZh:"二次元幻想 RPG", subtitleEn:"ANIME FANTASY RPG", type:"CHARACTER / CONCEPT", image:"/cover-huanshu.jpg", folder:"幻书启示录" },
  { no:"07", subtitleZh:"国风仙侠 RPG", subtitleEn:"CHINESE FANTASY RPG", type:"CHARACTER / CONCEPT", image:"/cover-xuanyuan.png", folder:"轩辕剑·龙舞云山" },
  { no:"08", subtitleZh:"国风回合制 RPG", subtitleEn:"CHINESE FANTASY RPG", type:"ART DIRECTION / CHARACTER", image:"/cover-taole.png", folder:"桃花源记 & 少年仙侠传" },
];

const projectCover = (project: (typeof projects)[number]) =>
  works.find((work) => work.project === project.folder && work.cover)?.image ?? project.image;

const portfolioWorks = works.filter((work) => !work.cover);

const experiences = [
  { period:"2025.02 — NOW", companyZh:"奕兆科技", companyEn:"Yizhao Technology", logo:"/logo-yizhao.png", mark:"YZ", roleZh:"美术总监", roleEn:"Art Director", projectZh:"ZODIAC HEROES · 欧美卡通三消", projectEn:"ZODIAC HEROES · Western Cartoon Match-3", descZh:"负责部门重建与 AI 赋能，制定 SOP、统一生产流程与交付标准，重构美术组织并承担最终品质审核。产品次留与转化数据提升 7 倍，超过竞品平均值。", descEn:"Rebuilt the art department and introduced AI-enabled workflows; established SOPs, unified production and delivery standards, reshaped the team structure and owned final quality approval. Improved day-two retention and conversion metrics sevenfold, surpassing competitor averages." },
  { period:"2020.09 — 2024.10", companyZh:"冰川网络", companyEn:"Glacier Network", logo:"/logo-bingchuan.png", mark:"BC", roleZh:"角色接口人 / 资深角色原画 / 美术中心原画主管", roleEn:"Character Art Owner / Senior Concept Artist / Concept Art Lead", projectZh:"悠星大陆 · 大世界开放世界", projectEn:"Astral Continent · Open-World Production", descZh:"参与前期美术风格孵化与方向定义，建立角色设计、制作规范和通用体型管线；负责核心角色原画、CP 资源对接与美术中台管理。", descEn:"Contributed to early visual style incubation and direction. Built character design standards, production specifications and a reusable body-type pipeline; led key character concepts, external partner coordination and central art-team management." },
  { period:"2017.09 — 2020.09", companyZh:"淘乐网络", companyEn:"Taole Network", logo:"/logo-taole.png", mark:"TL", roleZh:"主美 / 代号 S 项目主设计", roleEn:"Lead Artist / Project S Lead Designer", projectZh:"桃花源记 · 少年仙侠传", projectEn:"Tales of Peach Blossom · Young Immortal", descZh:"主导国风 Q 版回合制项目的美术风格孵化、设计与制作标准、项目目标及计划，并搭建美术中台与职级晋升体系。", descEn:"Led visual style development for stylized Chinese turn-based games, defining design and production standards, project goals and schedules while building a shared art platform and career progression system." },
  { period:"2014.09 — 2017.09", companyZh:"网易签约画师 / 个人工作室", companyEn:"NetEase Contract Artist / Independent Studio", logo:"/logo-netease.png", mark:"NE", roleZh:"签约画师 / 个人工作室负责人", roleEn:"Contract Artist / Studio Director", projectZh:"大话西游 · 梦幻西游 · 决战平安京 · 幻书启示录等 10+ 项目", projectEn:"Westward Journey · Fantasy Westward Journey · Onmyoji Arena · Revelation of Genesis and 10+ projects", descZh:"负责角色原画、立绘与 KV，并指导三视图、拆分、修图和图标制作，覆盖国风、和风与二次元题材。", descEn:"Created character concepts, key illustrations and key visuals, while directing turnarounds, asset breakdowns, retouching and icon production across Chinese fantasy, Japanese-inspired and anime styles." },
  { period:"2013.09 — 2014.09", companyZh:"深圳墨麟", companyEn:"Shenzhen Molin", logo:null, mark:"ML", roleZh:"角色主管 / 项目中后期主美术", roleEn:"Character Lead / Mid-to-Late Production Art Lead", projectZh:"热血屠龙 · 风云无双 WEB · 古剑 WEB", projectEn:"Dragon Slayer · Storm Warriors Web · Ancient Sword Web", descZh:"负责套装、坐骑、武器与翅膀等核心设计，并参与多个写实、3 渲 2 页游项目的角色美术管理。", descEn:"Owned core designs for outfits, mounts, weapons and wings, and managed character art across multiple realistic and 3D-to-2D web-game productions." },
  { period:"2011.05 — 2013.09", companyZh:"北京呈天游 T4GAME", companyEn:"Beijing T4GAME", logo:null, mark:"T4", roleZh:"原画设计 / 组长", roleEn:"Concept Artist / Team Lead", projectZh:"神游记 · 诛神 OL", projectEn:"Divine Journey · Godslayer Online", descZh:"负责主角套装、时装、坐骑与武器设计，在写实仙侠与卡通 3 渲 2 项目中完成从设计到团队协作的积累。", descEn:"Designed protagonist sets, costumes, mounts and weapons, building end-to-end design and team collaboration experience across realistic Chinese fantasy and stylized 3D-to-2D projects." },
  { period:"2008.12 — 2010.12", companyZh:"沈阳瀚唐", companyEn:"Shenyang Hantang", logo:null, mark:"HT", roleZh:"3D 模型师", roleEn:"3D Artist", projectZh:"哈派乐园", projectEn:"Happy Paradise", descZh:"负责角色、道具和场景模型，后期兼任原画、灯光渲染与动作捕捉调优，建立跨流程制作基础。", descEn:"Produced character, prop and environment models, later contributing concept art, lighting, rendering and motion-capture refinement to establish a broad cross-pipeline foundation." },
];

const strengths = [
  { no:"01", en:"ART MANAGEMENT", titleZh:"美术管理：从标准到落地", titleEn:"Art Management: From Standards to Delivery", descZh:"制定 SOP 与生产流程，建设角色管线、组织与晋升体系，并完成最终美术品质审核。", descEn:"Build SOPs and production workflows, establish character pipelines, team structures and promotion systems, and own final art-quality approval.", slides:[
    { page:"11", titleZh:"体型分层与角色需求覆盖", titleEn:"Body-Type Tiers and Character Coverage", image:"/strength-details/strength-01-01.png" },
    { page:"12", titleZh:"角色管线与制作规范", titleEn:"Character Pipeline and Production Standards", image:"/strength-details/strength-01-02.png" },
    { page:"13", titleZh:"原画、模型与 TA 品质闭环", titleEn:"Concept, Modeling and TA Quality Loop", image:"/strength-details/strength-01-03.png" },
  ]},
  { no:"02", en:"PRODUCT THINKING", titleZh:"产品意识：为结果设计", titleEn:"Product Thinking: Design for Outcomes", descZh:"具备多款 0–1 项目经验，以快速迭代、品质标杆、发行与商业化目标推动美术决策。", descEn:"Bring multiple zero-to-one project experiences, guiding art decisions through rapid iteration, quality benchmarks, publishing goals and commercial outcomes.", slides:[
    { page:"08", titleZh:"运营与商业化视觉", titleEn:"Live Operations and Commercial Visuals", image:"/strength-details/strength-02-01.png" },
    { page:"09", titleZh:"AIGC 与 Demo 快速验证", titleEn:"Rapid AIGC and Demo Validation", image:"/strength-details/strength-02-02.png" },
  ]},
  { no:"03", en:"DESIGN CRAFT", titleZh:"设计能力：从概念到成品", titleEn:"Design Craft: From Concept to Final", descZh:"覆盖风格孵化、角色原画、立绘与 KV，可从设计制作到 3D 还原进行全方位指导。", descEn:"Cover style development, character concepts, key illustrations and key visuals, with full-spectrum direction from design production through 3D realization.", slides:[
    { page:"18", titleZh:"从概念到成品的设计推导", titleEn:"Design Development from Concept to Final", image:"/strength-details/strength-03-01.png" },
  ]},
];

export default function Home() {
  const [locale, setLocale] = useState<Locale>("zh");
  const [filter, setFilter] = useState("全部");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openProject, setOpenProject] = useState<string | null>(null);
  const [openStrength, setOpenStrength] = useState<number | null>(null);
  const [strengthPage, setStrengthPage] = useState(0);
  const copy = COPY[locale];
  const isEnglish = locale === "en";
  const tags = ["全部", "视频动画", "角色设计", "概念设计", "UI视觉", "场景设计", "宣传视觉", "制作管理"];
  const visibleWorks = useMemo(() => filter === "全部" ? portfolioWorks : portfolioWorks.filter((work) => work.tag === filter), [filter]);
  const workGroups = useMemo(() => {
    const knownProjects = new Set(projects.map((project) => project.folder));
    const groups = projects.map((project) => ({
      title: projectLabel(project.folder, locale),
      folder: project.folder,
      items: visibleWorks.filter((work) => work.project === project.folder),
    })).filter((group) => group.items.length > 0);
    const extras = visibleWorks.filter((work) => !knownProjects.has(work.project));
    return extras.length ? [...groups, { title: copy.otherWorks, folder: "其他作品", items: extras }] : groups;
  }, [copy.otherWorks, locale, visibleWorks]);
  const projectWorks = useMemo(() => openProject ? portfolioWorks.filter((work) => work.project === openProject) : [], [openProject]);
  const activeWorks = openProject ? projectWorks : visibleWorks;
  const selectedIndex = activeWorks.findIndex((work) => work.id === selectedId);
  const selectedWork = selectedIndex >= 0 ? activeWorks[selectedIndex] : null;
  const activeStrength = openStrength === null ? null : strengths[openStrength];
  const activeStrengthSlide = activeStrength?.slides[strengthPage] ?? null;

  useEffect(() => {
    document.documentElement.lang = isEnglish ? "en" : "zh-CN";
  }, [isEnglish]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (reduceMotion) {
      revealNodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }
    revealNodes.forEach((node, index) => node.style.setProperty("--delay", `${(index % 7) * 70}ms`));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -9% 0px" });
    const observed = new WeakSet<Element>();
    const observeWithin = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((node, index) => {
        if (observed.has(node)) return;
        observed.add(node);
        node.style.setProperty("--delay", `${(index % 7) * 70}ms`);
        observer.observe(node);
      });
    };
    observeWithin(document);
    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof Element) observeWithin(node.matches("[data-reveal]") ? node.parentElement ?? document : node);
      }));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const onPointerMove = (event: PointerEvent) => {
      document.documentElement.style.setProperty("--mx", (event.clientX / window.innerWidth - 0.5).toFixed(4));
      document.documentElement.style.setProperty("--my", (event.clientY / window.innerHeight - 0.5).toFixed(4));
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-tilt]");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--px", `${event.clientX - rect.left}px`);
      target.style.setProperty("--py", `${event.clientY - rect.top}px`);
      target.style.setProperty("--rx", `${(((event.clientY - rect.top) / rect.height - 0.5) * -7).toFixed(2)}deg`);
      target.style.setProperty("--ry", `${(((event.clientX - rect.left) / rect.width - 0.5) * 7).toFixed(2)}deg`);
    };
    const onPointerOut = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-tilt]");
      target?.style.setProperty("--rx", "0deg");
      target?.style.setProperty("--ry", "0deg");
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerout", onPointerOut);
    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut);
    };
  }, []);

  useEffect(() => {
    if (!selectedWork && !openProject && !activeStrength) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectedWork) setSelectedId(null);
        else if (openProject) setOpenProject(null);
        else setOpenStrength(null);
      }
      if (selectedWork && event.key === "ArrowRight") setSelectedId(activeWorks[(selectedIndex + 1) % activeWorks.length].id);
      if (selectedWork && event.key === "ArrowLeft") setSelectedId(activeWorks[(selectedIndex - 1 + activeWorks.length) % activeWorks.length].id);
      if (activeStrength && event.key === "ArrowRight") setStrengthPage((current) => (current + 1) % activeStrength.slides.length);
      if (activeStrength && event.key === "ArrowLeft") setStrengthPage((current) => (current - 1 + activeStrength.slides.length) % activeStrength.slides.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeStrength, activeWorks, openProject, selectedIndex, selectedWork]);

  return (
    <main>
      <section className="hero" id="top">
        <ScrubbedHeroVideo src={asset("/hero-head-follow.mp4")} poster={asset("/zodiac-cover.png")} />
        <div className="hero-shade" />
        <header className="nav shell">
          <a className="brand" href="#top" aria-label={copy.homeLabel}>JZ<span>.</span></a>
          <nav aria-label={copy.navLabel}><a href="#experience">{copy.navExperience}</a><a href="#projects">{copy.navProjects}</a><a href="#strengths">{copy.navStrengths}</a><a href="#works">{copy.navWorks}</a></nav>
          <div className="nav-actions"><div className="language-switch" role="group" aria-label={isEnglish ? "Choose language" : "选择语言"}><button type="button" className={!isEnglish ? "active" : ""} onClick={() => setLocale("zh")} aria-pressed={!isEnglish}>中</button><button type="button" className={isEnglish ? "active" : ""} onClick={() => setLocale("en")} aria-pressed={isEnglish}>EN</button></div><a className="contact-link" href="#contact">{copy.contact} <span>↗</span></a></div>
        </header>
        <div className="hero-content shell">
          <div className="hero-heading-row">
            <h1>JASON<span>·</span>ZHANG</h1>
            <p className="eyebrow"><span /> {copy.heroBadge}</p>
          </div>
          <div className="hero-bottom"><p>{copy.heroTagline}</p><div className="hero-metrics"><span><b>17+</b> {copy.metrics[0]}</span><span><b>10+</b> {copy.metrics[1]}</span><span><b>7</b> {copy.metrics[2]}</span></div><a href="#experience" className="scroll-cue"><span>↓</span> {copy.scroll}</a></div>
        </div>
        <div className="hero-showcase" aria-label={copy.showcaseLabel}><div className="hero-showcase-track">{[...projects, ...projects].map((project, index) => <button key={`${project.no}-${index}`} onClick={() => setOpenProject(project.folder)}><img src={asset(projectCover(project))} alt="" /><span>{projectLabel(project.folder, locale)}</span></button>)}</div></div>
        <div className="hero-index">01 <span>/</span> 05</div>
      </section>

      <section className="about section shell" id="experience">
        <div className="section-head" data-reveal><p>01 / ABOUT & EXPERIENCE</p><p>{copy.location}</p></div>
        <div className="about-grid">
          <div className="portrait-wrap portrait-ailin" data-reveal data-tilt><img src={asset("/portrait-ailin.png")} alt={copy.portraitAlt} /><span className="portrait-label">EILEEN · SELECTED CHARACTER ART</span></div>
          <div className="intro" data-reveal data-tilt>
            <p className="eyebrow dark"><span /> {copy.introBadge}</p>
            <h2 className="intro-title"><span className="intro-en">DESIGN · SYSTEM · DELIVERY</span><span className="intro-cn">{copy.introLead}<br />{copy.introLeadSecond}</span></h2>
            <p className="intro-copy"><span className="copy-en">17+ YEARS IN GAME ART / ART DIRECTION &amp; TEAM LEADERSHIP</span>{copy.introCopy}</p>
            <div className="facts"><div><b>17+</b><span><em>YEARS</em>{copy.factYears}</span></div><div><b>10+</b><span><em>PROJECTS</em>{copy.factProjects}</span></div><div><b>0→1</b><span><em>FULL CYCLE</em>{copy.factCycle}</span></div></div>
            <div className="resume-note"><span>CORE EXPERTISE</span>{copy.expertise}</div>
          </div>
        </div>
        <div className="timeline">
          {experiences.map((item) => <article className="timeline-row" data-reveal data-tilt key={item.companyZh}>
            <span className="timeline-no">{item.period}</span>{item.logo ? <img src={asset(item.logo)} alt={`${isEnglish ? item.companyEn : item.companyZh} logo`} /> : <span className="company-mark" aria-hidden="true">{item.mark}</span>}
            <div><h3>{isEnglish ? item.companyEn : item.companyZh}</h3><p>{isEnglish ? item.projectEn : item.projectZh}</p></div><div><strong>{isEnglish ? item.roleEn : item.roleZh}</strong><p>{isEnglish ? item.descEn : item.descZh}</p></div>
          </article>)}
        </div>
      </section>

      <section className="projects section" id="projects">
        <div className="shell"><div className="section-head light" data-reveal><p>02 / SELECTED PROJECTS</p><p>2010s — {isEnglish ? "NOW" : "至今"}</p></div><div className="title-row" data-reveal><h2>PROJECT<br /><span>ARCHIVE</span></h2><p>{copy.projectSectionCopy.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</p></div>
          <div className="project-grid">{projects.map(project => <button type="button" className="project-card" data-reveal data-tilt key={project.no} onClick={() => { setOpenProject(project.folder); setSelectedId(null); }} aria-label={`${copy.viewProject}: ${projectLabel(project.folder, locale)}`}>
            <img src={asset(projectCover(project))} alt={`${projectLabel(project.folder, locale)} ${copy.projectCover}`} loading="lazy" /><div className="project-overlay" /><span className="project-no">{project.no}</span><div className="project-copy"><p>{project.type}</p><h3>{projectLabel(project.folder, locale)}</h3><span>{isEnglish ? project.subtitleEn : project.subtitleZh} · {portfolioWorks.filter((work) => work.project === project.folder).length} {copy.worksUnit}</span></div><span className="card-arrow">↗</span>
          </button>)}</div>
        </div>
      </section>

      <section className="strengths section shell" id="strengths">
        <div className="section-head" data-reveal><p>03 / CORE STRENGTHS</p><p>THINK · BUILD · DELIVER</p></div>
        <div className="title-row dark-title" data-reveal><h2>WHAT I<br /><span>BRING</span></h2><p>{copy.strengthSectionCopy.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</p></div>
        <div className="strength-grid">{strengths.map((item, index) => <button type="button" className="strength-card" data-reveal data-tilt key={item.no} onClick={() => { setOpenStrength(index); setStrengthPage(0); }} aria-label={`${copy.viewCases}: ${isEnglish ? item.titleEn : item.titleZh}`}><span>{item.no}</span><p>{item.en}</p><h3>{isEnglish ? item.titleEn : item.titleZh}</h3><div className="skill-mark">↗</div><p className="skill-desc">{isEnglish ? item.descEn : item.descZh}</p><div className="strength-card-action"><span>{copy.viewCases}</span><b>{String(item.slides.length).padStart(2,"0")} {copy.pages}</b></div></button>)}</div>
      </section>

      <section className="works section" id="works">
        <div className="shell"><div className="section-head light" data-reveal><p>04 / PERSONAL WORKS</p><p>CURATED SELECTION</p></div>
          <div className="works-top" data-reveal><div><h2>WORKS<span>.</span></h2><p className="work-count">{String(visibleWorks.length).padStart(3, "0")} / {String(portfolioWorks.length).padStart(3, "0")} {copy.worksUnit.toUpperCase()}</p></div><div className="filters" role="group" aria-label={copy.filtersLabel}>{tags.map(tag => <button className={filter === tag ? "active" : ""} onClick={() => { setFilter(tag); setSelectedId(null); }} key={tag}>{tagLabel(tag, locale)}</button>)}</div></div>
          <div className="work-project-groups">{workGroups.map((group, groupIndex) => <section className="work-project-group" key={group.folder}>
            <div className="work-project-head" data-reveal><span>{String(groupIndex + 1).padStart(2, "0")}</span><h3>{group.title}</h3><p>{String(group.items.length).padStart(2, "0")} {copy.worksUnit.toUpperCase()}</p></div>
            <div className="works-grid">{group.items.map((work) => <article className="work-card" data-reveal data-tilt key={work.id}>
              <button className="work-preview" style={{ aspectRatio: `${work.width} / ${work.height}` }} onClick={() => setSelectedId(work.id)} aria-label={`${copy.enlarge}: ${workTitle(work.title, locale)}`}>
                {work.media === "video" ? <video src={asset(work.image)} muted loop playsInline preload="metadata" onMouseEnter={(event) => { void event.currentTarget.play().catch(() => undefined); }} onMouseLeave={(event) => { event.currentTarget.pause(); if (event.currentTarget.readyState > 0) event.currentTarget.currentTime = 0; }} /> : <img src={asset(work.image)} alt={workTitle(work.title, locale)} loading="lazy" width={work.width} height={work.height} />}<span>{work.media === "video" ? `${copy.play.toUpperCase()} ▶` : `${copy.view.toUpperCase()} ↗`}</span>
              </button>
              <div className="work-meta"><p>{projectLabel(work.project, locale)} · {tagLabel(work.tag, locale)}</p><span>{String(visibleWorks.indexOf(work) + 1).padStart(3, "0")}</span></div><h3>{workTitle(work.title, locale)}</h3>
            </article>)}</div>
          </section>)}</div>
        </div>
      </section>

      {openProject && <div className="project-gallery" role="dialog" aria-modal="true" aria-label={`${projectLabel(openProject, locale)} ${copy.projectArchive}`}>
        <header className="project-gallery-head"><div><span>{copy.projectArchive.toUpperCase()}</span><h2>{projectLabel(openProject, locale)}</h2><p>{String(projectWorks.length).padStart(2, "0")} {copy.worksUnit.toUpperCase()}</p></div><button onClick={() => { setOpenProject(null); setSelectedId(null); }} aria-label={copy.closeGallery}>{copy.close.toUpperCase()} ×</button></header>
        <div className="project-gallery-grid">{projectWorks.map((work, index) => <article data-reveal data-tilt key={work.id}>
          <button style={{ aspectRatio: `${work.width} / ${work.height}` }} onClick={() => setSelectedId(work.id)} aria-label={`${work.media === "video" ? copy.play : copy.enlarge}: ${workTitle(work.title, locale)}`}>{work.media === "video" ? <video src={asset(work.image)} muted loop playsInline preload="metadata" onMouseEnter={(event) => { void event.currentTarget.play().catch(() => undefined); }} onMouseLeave={(event) => { event.currentTarget.pause(); if (event.currentTarget.readyState > 0) event.currentTarget.currentTime = 0; }} /> : <img src={asset(work.image)} alt={workTitle(work.title, locale)} loading="lazy" width={work.width} height={work.height} />}<span>{work.media === "video" ? `${copy.play.toUpperCase()} ▶` : `${copy.view.toUpperCase()} ↗`}</span></button>
          <div><p>{tagLabel(work.tag, locale)}</p><span>{String(index + 1).padStart(2, "0")}</span></div><h3>{workTitle(work.title, locale)}</h3>
        </article>)}</div>
      </div>}

      {selectedWork && <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${workTitle(selectedWork.title, locale)} ${copy.imagePreview}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}>
        <div className="lightbox-top"><div><span>{projectLabel(selectedWork.project, locale)}</span><strong>{workTitle(selectedWork.title, locale)}</strong></div><button onClick={() => setSelectedId(null)} aria-label={copy.closePreview}>{copy.close.toUpperCase()} ×</button></div>
        <div className="lightbox-stage">{selectedWork.media === "video" ? <video src={asset(selectedWork.image)} controls autoPlay playsInline /> : <img src={asset(selectedWork.image)} alt={workTitle(selectedWork.title, locale)} width={selectedWork.width} height={selectedWork.height} />}</div>
        <div className="lightbox-bottom"><button onClick={() => setSelectedId(activeWorks[(selectedIndex - 1 + activeWorks.length) % activeWorks.length].id)} aria-label={copy.previous}>← {copy.previous.toUpperCase()}</button><span>{String(selectedIndex + 1).padStart(3, "0")} / {String(activeWorks.length).padStart(3, "0")} · {tagLabel(selectedWork.tag, locale)}</span><button onClick={() => setSelectedId(activeWorks[(selectedIndex + 1) % activeWorks.length].id)} aria-label={copy.next}>{copy.next.toUpperCase()} →</button></div>
      </div>}

      {activeStrength && activeStrengthSlide && <div className="strength-browser" role="dialog" aria-modal="true" aria-label={`${isEnglish ? activeStrength.titleEn : activeStrength.titleZh} ${copy.strengthBrowser}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpenStrength(null); }}>
        <header className="strength-browser-head"><div><span>CORE STRENGTH {activeStrength.no}</span><h2>{isEnglish ? activeStrength.titleEn : activeStrength.titleZh}</h2><p>{activeStrength.en} · PPT {activeStrengthSlide.page}</p></div><button type="button" onClick={() => setOpenStrength(null)} aria-label={copy.closeStrength}>{copy.close.toUpperCase()} ×</button></header>
        <div className="strength-browser-stage"><img src={asset(activeStrengthSlide.image)} alt={interpolate(copy.pptPageAlt, { page: activeStrengthSlide.page, title: isEnglish ? activeStrengthSlide.titleEn : activeStrengthSlide.titleZh })} width="1920" height="1080" /></div>
        <footer className="strength-browser-foot"><button type="button" onClick={() => setStrengthPage((current) => (current - 1 + activeStrength.slides.length) % activeStrength.slides.length)} disabled={activeStrength.slides.length === 1} aria-label={copy.previousPage}>← {copy.previous.toUpperCase()}</button><div className="strength-browser-pages">{activeStrength.slides.map((slide, index) => <button type="button" className={index === strengthPage ? "active" : ""} onClick={() => setStrengthPage(index)} key={slide.page} aria-label={interpolate(copy.viewPptPage, { page: slide.page })}><span>{slide.page}</span><b>{isEnglish ? slide.titleEn : slide.titleZh}</b></button>)}</div><button type="button" onClick={() => setStrengthPage((current) => (current + 1) % activeStrength.slides.length)} disabled={activeStrength.slides.length === 1} aria-label={copy.nextPage}>{copy.next.toUpperCase()} →</button></footer>
      </div>}

      <footer className="contact" id="contact">
        <div className="contact-orbit" aria-hidden="true" />
        <div className="shell contact-inner" data-reveal><p className="eyebrow"><span /> {copy.available}</p><h2>{copy.contactHeadline}<br /><em>{copy.contactHeadlineAccent}</em> {copy.contactHeadlineEnd}<span>.</span></h2>
          <div className="contact-bottom"><div><p>{copy.contactCopy}</p><div className="contact-details"><span>{copy.city}</span><a href="tel:+8618600805208">186 0080 5208</a><a href="mailto:860404@qq.com">860404@qq.com</a></div></div><a className="back-top" href="#top" aria-label={copy.backTop}>↑</a></div>
        </div>
        <div className="footer-line shell"><span>© 2026 JASON ZHANG</span><span>{copy.heroBadge}</span></div>
      </footer>
    </main>
  );
}
