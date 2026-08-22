"use client";

import { useEffect, useMemo, useState } from "react";
import works from "./portfolio-manifest.json";

const asset = (path: string) => path.startsWith("/") ? `.${path}` : path;

const projects = [
  { no:"01", title:"ZODIAC HEROES", cn:"十二星座英雄", type:"ART DIRECTION / UI / CHARACTER", image:"/zodiac-cover.png", folder:"Zodiac Heroes" },
  { no:"02", title:"悠星大陆", cn:"OPEN WORLD RPG", type:"ART DIRECTION / PIPELINE", image:"/cover-youxing.jpg", folder:"悠星大陆" },
  { no:"03", title:"决战！平安京", cn:"ONMYOJI ARENA", type:"CHARACTER / CONCEPT", image:"/cover-paj.png", folder:"决战平安京" },
  { no:"04", title:"大话西游手游", cn:"WESTWARD JOURNEY MOBILE", type:"CHARACTER / ILLUSTRATION", image:"/cover-dhsy.png", folder:"大话西游手游" },
  { no:"05", title:"大话西游端游", cn:"WESTWARD JOURNEY ONLINE", type:"CONCEPT / ILLUSTRATION", image:"/cover-dhpc.jpg", folder:"大话西游端游" },
  { no:"06", title:"幻书启示录", cn:"REVELATION OF GENESIS", type:"CHARACTER / CONCEPT", image:"/cover-huanshu.jpg", folder:"幻书启示录" },
  { no:"07", title:"轩辕剑·龙舞云山", cn:"XUANYUAN SWORD", type:"CHARACTER / CONCEPT", image:"/cover-xuanyuan.png", folder:"轩辕剑·龙舞云山" },
  { no:"08", title:"桃花源记 & 少年仙侠传", cn:"TALES OF PEACH BLOSSOM", type:"ART DIRECTION / CHARACTER", image:"/cover-taole.png", folder:"桃花源记 & 少年仙侠传" },
];

const projectCover = (project: (typeof projects)[number]) =>
  works.find((work) => work.project === project.folder && work.cover)?.image ?? project.image;

const portfolioWorks = works.filter((work) => !work.cover);

const experiences = [
  { period:"2025.02 — NOW", company:"奕兆科技", logo:"/logo-yizhao.png", mark:"YZ", role:"美术总监", project:"ZODIAC HEROES · 欧美卡通三消", desc:"负责部门重建与 AI 赋能，制定 SOP、统一生产流程与交付标准，重构美术组织并承担最终品质审核。产品次留与转化数据提升 7 倍，超过竞品平均值。" },
  { period:"2020.09 — 2024.10", company:"冰川网络", logo:"/logo-bingchuan.png", mark:"BC", role:"角色接口人 / 资深角色原画 / 美术中心原画主管", project:"悠星大陆 · 大世界开放世界", desc:"参与前期美术风格孵化与方向定义，建立角色设计、制作规范和通用体型管线；负责核心角色原画、CP 资源对接与美术中台管理。" },
  { period:"2017.09 — 2020.09", company:"淘乐网络", logo:"/logo-taole.png", mark:"TL", role:"主美 / 代号 S 项目主设计", project:"桃花源记 · 少年仙侠传", desc:"主导国风 Q 版回合制项目的美术风格孵化、设计与制作标准、项目目标及计划，并搭建美术中台与职级晋升体系。" },
  { period:"2014.09 — 2017.09", company:"网易签约画师 / 个人工作室", logo:"/logo-netease.png", mark:"NE", role:"签约画师 / 个人工作室负责人", project:"大话西游 · 梦幻西游 · 决战平安京 · 幻书启示录等 10+ 项目", desc:"负责角色原画、立绘与 KV，并指导三视图、拆分、修图和图标制作，覆盖国风、和风与二次元题材。" },
  { period:"2013.09 — 2014.09", company:"深圳墨麟", logo:null, mark:"ML", role:"角色主管 / 项目中后期主美术", project:"热血屠龙 · 风云无双 WEB · 古剑 WEB", desc:"负责套装、坐骑、武器与翅膀等核心设计，并参与多个写实、3 渲 2 页游项目的角色美术管理。" },
  { period:"2011.05 — 2013.09", company:"北京呈天游 T4GAME", logo:null, mark:"T4", role:"原画设计 / 组长", project:"神游记 · 诛神 OL", desc:"负责主角套装、时装、坐骑与武器设计，在写实仙侠与卡通 3 渲 2 项目中完成从设计到团队协作的积累。" },
  { period:"2008.12 — 2010.12", company:"沈阳瀚唐", logo:null, mark:"HT", role:"3D 模型师", project:"哈派乐园", desc:"负责角色、道具和场景模型，后期兼任原画、灯光渲染与动作捕捉调优，建立跨流程制作基础。" },
];

const strengths = [
  ["01","ART MANAGEMENT","美术管理：从标准到落地","制定 SOP 与生产流程，建设角色管线、组织与晋升体系，并完成最终美术品质审核。"],
  ["02","PRODUCT THINKING","产品意识：为结果设计","具备多款 0–1 项目经验，以快速迭代、品质标杆、发行与商业化目标推动美术决策。"],
  ["03","DESIGN CRAFT","设计能力：从概念到成品","覆盖风格孵化、角色原画、立绘与 KV，可从设计制作到 3D 还原进行全方位指导。"],
];

export default function Home() {
  const [filter, setFilter] = useState("全部");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openProject, setOpenProject] = useState<string | null>(null);
  const tags = ["全部", "视频动画", "角色设计", "概念设计", "UI视觉", "场景设计", "宣传视觉", "制作管理"];
  const visibleWorks = useMemo(() => filter === "全部" ? portfolioWorks : portfolioWorks.filter((work) => work.tag === filter), [filter]);
  const workGroups = useMemo(() => {
    const knownProjects = new Set(projects.map((project) => project.folder));
    const groups = projects.map((project) => ({
      title: project.title,
      folder: project.folder,
      items: visibleWorks.filter((work) => work.project === project.folder),
    })).filter((group) => group.items.length > 0);
    const extras = visibleWorks.filter((work) => !knownProjects.has(work.project));
    return extras.length ? [...groups, { title: "OTHER WORKS", folder: "其他作品", items: extras }] : groups;
  }, [visibleWorks]);
  const projectWorks = useMemo(() => openProject ? portfolioWorks.filter((work) => work.project === openProject) : [], [openProject]);
  const activeWorks = openProject ? projectWorks : visibleWorks;
  const selectedIndex = activeWorks.findIndex((work) => work.id === selectedId);
  const selectedWork = selectedIndex >= 0 ? activeWorks[selectedIndex] : null;

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
    if (!selectedWork && !openProject) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") selectedWork ? setSelectedId(null) : setOpenProject(null);
      if (selectedWork && event.key === "ArrowRight") setSelectedId(activeWorks[(selectedIndex + 1) % activeWorks.length].id);
      if (selectedWork && event.key === "ArrowLeft") setSelectedId(activeWorks[(selectedIndex - 1 + activeWorks.length) % activeWorks.length].id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeWorks, openProject, selectedIndex, selectedWork]);

  return (
    <main>
      <section className="hero" id="top">
        <video className="hero-video" autoPlay muted loop playsInline poster={asset("/zodiac-cover.png")}><source src={asset("/hero.mp4")} type="video/mp4" /></video>
        <div className="hero-shade" />
        <header className="nav shell">
          <a className="brand" href="#top" aria-label="张斌个人作品集首页">BZ<span>.</span></a>
          <nav aria-label="主导航"><a href="#experience">经历</a><a href="#projects">项目</a><a href="#strengths">优势</a><a href="#works">作品</a></nav>
          <a className="contact-link" href="#contact">联系我 <span>↗</span></a>
        </header>
        <div className="hero-content shell">
          <p className="eyebrow"><span /> GAME ART DIRECTOR · PORTFOLIO</p>
          <h1>CREATING<br />WORLDS<span>.</span></h1>
          <div className="hero-bottom"><p>张斌 · 游戏美术总监<br />让美术为产品服务，让品质真正落地</p><div className="hero-metrics"><span><b>17+</b> 年行业经验</span><span><b>10+</b> 参与项目</span><span><b>7</b> 段职业经历</span></div><a href="#experience" className="scroll-cue"><span>↓</span> SCROLL TO EXPLORE</a></div>
        </div>
        <div className="hero-showcase" aria-label="精选项目快速预览"><div className="hero-showcase-track">{[...projects, ...projects].map((project, index) => <button key={`${project.no}-${index}`} onClick={() => setOpenProject(project.folder)}><img src={asset(projectCover(project))} alt="" /><span>{project.title}</span></button>)}</div></div>
        <div className="hero-index">01 <span>/</span> 05</div>
      </section>

      <section className="about section shell" id="experience">
        <div className="section-head" data-reveal><p>01 / ABOUT & EXPERIENCE</p><p>SHENZHEN · CHINA</p></div>
        <div className="about-grid">
          <div className="portrait-wrap portrait-ailin" data-reveal data-tilt><img src={asset("/portrait-ailin.png")} alt="《Zodiac Heroes》艾琳角色美术作品" /><span className="portrait-label">EILEEN · SELECTED CHARACTER ART</span></div>
          <div className="intro" data-reveal data-tilt>
            <p className="eyebrow dark"><span /> ZHANG BIN / GAME ART DIRECTOR</p>
            <h2 className="intro-title"><span className="intro-en">DESIGN · SYSTEM · DELIVERY</span><span className="intro-cn">从设计到管理<br />让品质真正落地</span></h2>
            <p className="intro-copy"><span className="copy-en">17+ YEARS IN GAME ART / ART DIRECTION &amp; TEAM LEADERSHIP</span>17+ 年游戏美术经验，覆盖 MMO、开放世界、RPG 与休闲三消。历任美术总监、主美、角色主管与资深角色原画，具备风格探索、标准制定、团队协作和上线验收经验。</p>
            <div className="facts"><div><b>17+</b><span><em>YEARS</em>游戏美术经验</span></div><div><b>10+</b><span><em>PROJECTS</em>参与项目</span></div><div><b>0→1</b><span><em>FULL CYCLE</em>完整开发经验</span></div></div>
            <div className="resume-note"><span>CORE EXPERTISE</span>风格化角色设计 · PBR · 卡通渲染 · 3 渲 2 · 3D 制作流程 · 品质与团队管理</div>
          </div>
        </div>
        <div className="timeline">
          {experiences.map((item) => <article className="timeline-row" data-reveal data-tilt key={item.company}>
            <span className="timeline-no">{item.period}</span>{item.logo ? <img src={asset(item.logo)} alt={`${item.company} logo`} /> : <span className="company-mark" aria-hidden="true">{item.mark}</span>}
            <div><h3>{item.company}</h3><p>{item.project}</p></div><div><strong>{item.role}</strong><p>{item.desc}</p></div>
          </article>)}
        </div>
      </section>

      <section className="projects section" id="projects">
        <div className="shell"><div className="section-head light" data-reveal><p>02 / SELECTED PROJECTS</p><p>2010s — NOW</p></div><div className="title-row" data-reveal><h2>PROJECT<br /><span>ARCHIVE</span></h2><p>跨越卡牌、MMO、MOBA 与国风仙侠<br />从视觉定位到最终落地的项目实践</p></div>
          <div className="project-grid">{projects.map(project => <button type="button" className="project-card" data-reveal data-tilt key={project.no} onClick={() => { setOpenProject(project.folder); setSelectedId(null); }} aria-label={`查看 ${project.title} 项目作品`}>
            <img src={asset(projectCover(project))} alt={`${project.title} 项目封面`} loading="lazy" /><div className="project-overlay" /><span className="project-no">{project.no}</span><div className="project-copy"><p>{project.type}</p><h3>{project.title}</h3><span>{project.cn} · {portfolioWorks.filter((work) => work.project === project.folder).length} WORKS</span></div><span className="card-arrow">↗</span>
          </button>)}</div>
        </div>
      </section>

      <section className="strengths section shell" id="strengths">
        <div className="section-head" data-reveal><p>03 / CORE STRENGTHS</p><p>THINK · BUILD · DELIVER</p></div>
        <div className="title-row dark-title" data-reveal><h2>WHAT I<br /><span>BRING</span></h2><p>从审美判断到生产管理<br />把模糊的创意转化为可落地的产品语言</p></div>
        <div className="strength-grid">{strengths.map(item => <article data-reveal data-tilt key={item[0]}><span>{item[0]}</span><p>{item[1]}</p><h3>{item[2]}</h3><div className="skill-mark">+</div><p className="skill-desc">{item[3]}</p></article>)}</div>
      </section>

      <section className="works section" id="works">
        <div className="shell"><div className="section-head light" data-reveal><p>04 / PERSONAL WORKS</p><p>CURATED SELECTION</p></div>
          <div className="works-top" data-reveal><div><h2>WORKS<span>.</span></h2><p className="work-count">{String(visibleWorks.length).padStart(3, "0")} / {String(portfolioWorks.length).padStart(3, "0")} WORKS</p></div><div className="filters" role="group" aria-label="作品类别筛选">{tags.map(tag => <button className={filter === tag ? "active" : ""} onClick={() => { setFilter(tag); setSelectedId(null); }} key={tag}>{tag}</button>)}</div></div>
          <div className="work-project-groups">{workGroups.map((group, groupIndex) => <section className="work-project-group" key={group.folder}>
            <div className="work-project-head" data-reveal><span>{String(groupIndex + 1).padStart(2, "0")}</span><h3>{group.title}</h3><p>{String(group.items.length).padStart(2, "0")} WORKS</p></div>
            <div className="works-grid">{group.items.map((work) => <article className="work-card" data-reveal data-tilt key={work.id}>
              <button className="work-preview" style={{ aspectRatio: `${work.width} / ${work.height}` }} onClick={() => setSelectedId(work.id)} aria-label={`放大查看 ${work.title}`}>
                {work.media === "video" ? <video src={asset(work.image)} muted loop playsInline preload="metadata" onMouseEnter={(event) => { void event.currentTarget.play().catch(() => undefined); }} onMouseLeave={(event) => { event.currentTarget.pause(); if (event.currentTarget.readyState > 0) event.currentTarget.currentTime = 0; }} /> : <img src={asset(work.image)} alt={work.title} loading="lazy" width={work.width} height={work.height} />}<span>{work.media === "video" ? "PLAY ▶" : "VIEW ↗"}</span>
              </button>
              <div className="work-meta"><p>{work.project} · {work.tag}</p><span>{String(visibleWorks.indexOf(work) + 1).padStart(3, "0")}</span></div><h3>{work.title}</h3>
            </article>)}</div>
          </section>)}</div>
        </div>
      </section>

      {openProject && <div className="project-gallery" role="dialog" aria-modal="true" aria-label={`${openProject} 项目作品集`}>
        <header className="project-gallery-head"><div><span>PROJECT ARCHIVE</span><h2>{openProject}</h2><p>{String(projectWorks.length).padStart(2, "0")} WORKS</p></div><button onClick={() => { setOpenProject(null); setSelectedId(null); }} aria-label="关闭项目作品集">CLOSE ×</button></header>
        <div className="project-gallery-grid">{projectWorks.map((work, index) => <article data-reveal data-tilt key={work.id}>
          <button style={{ aspectRatio: `${work.width} / ${work.height}` }} onClick={() => setSelectedId(work.id)} aria-label={`${work.media === "video" ? "播放" : "放大查看"} ${work.title}`}>{work.media === "video" ? <video src={asset(work.image)} muted loop playsInline preload="metadata" onMouseEnter={(event) => { void event.currentTarget.play().catch(() => undefined); }} onMouseLeave={(event) => { event.currentTarget.pause(); if (event.currentTarget.readyState > 0) event.currentTarget.currentTime = 0; }} /> : <img src={asset(work.image)} alt={work.title} loading="lazy" width={work.width} height={work.height} />}<span>{work.media === "video" ? "PLAY ▶" : "VIEW ↗"}</span></button>
          <div><p>{work.tag}</p><span>{String(index + 1).padStart(2, "0")}</span></div><h3>{work.title}</h3>
        </article>)}</div>
      </div>}

      {selectedWork && <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${selectedWork.title} 大图预览`} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}>
        <div className="lightbox-top"><div><span>{selectedWork.project}</span><strong>{selectedWork.title}</strong></div><button onClick={() => setSelectedId(null)} aria-label="关闭大图">CLOSE ×</button></div>
        <div className="lightbox-stage">{selectedWork.media === "video" ? <video src={asset(selectedWork.image)} controls autoPlay playsInline /> : <img src={asset(selectedWork.image)} alt={selectedWork.title} width={selectedWork.width} height={selectedWork.height} />}</div>
        <div className="lightbox-bottom"><button onClick={() => setSelectedId(activeWorks[(selectedIndex - 1 + activeWorks.length) % activeWorks.length].id)} aria-label="上一张">← PREV</button><span>{String(selectedIndex + 1).padStart(3, "0")} / {String(activeWorks.length).padStart(3, "0")} · {selectedWork.tag}</span><button onClick={() => setSelectedId(activeWorks[(selectedIndex + 1) % activeWorks.length].id)} aria-label="下一张">NEXT →</button></div>
      </div>}

      <footer className="contact" id="contact">
        <div className="contact-orbit" aria-hidden="true" />
        <div className="shell contact-inner" data-reveal><p className="eyebrow"><span /> AVAILABLE FOR NEW CHALLENGES</p><h2>LET&apos;S CREATE<br /><em>SOMETHING</em> GREAT<span>.</span></h2>
          <div className="contact-bottom"><div><p>期待与你聊聊下一个值得被看见的世界。</p><div className="contact-details"><span>深圳</span><a href="tel:+8618600805208">186 0080 5208</a><a href="mailto:860404@qq.com">860404@qq.com</a></div></div><a className="back-top" href="#top" aria-label="回到顶部">↑</a></div>
        </div>
        <div className="footer-line shell"><span>© 2026 ZHANG BIN</span><span>GAME ART DIRECTOR · PORTFOLIO</span></div>
      </footer>
    </main>
  );
}
