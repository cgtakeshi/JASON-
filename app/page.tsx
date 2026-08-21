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

const experiences = [
  { company:"奕兆游戏", logo:"/logo-yizhao.png", role:"游戏美术总监 / 主美", project:"ZODIAC HEROES", desc:"负责项目整体视觉定位、角色与 UI 风格管理，推进从概念到引擎落地的品质一致性。" },
  { company:"冰川网络", logo:"/logo-bingchuan.png", role:"主美 / 角色管线负责人", project:"悠星大陆", desc:"搭建开放世界角色管线，制定设计规范、通用体型和资源验收标准，把控角色最终落地品质。" },
  { company:"网易游戏", logo:"/logo-netease.png", role:"高级游戏美术 / 概念设计", project:"决战平安京 · 大话西游 · 幻书启世录", desc:"参与多个成熟 IP 的角色设定与概念创作，在风格传承、角色识别度与商业化表达之间建立平衡。" },
  { company:"淘乐网络", logo:"/logo-taole.png", role:"游戏美术", project:"桃花源记 · 少年仙侠传", desc:"负责角色、插图与视觉标杆设计，建立国风仙侠项目的世界观氛围与角色语言。" },
];

const strengths = [
  ["01","ART DIRECTION","美术方向与风格定义","从产品定位出发，建立可执行、可延展的视觉体系。"],
  ["02","TEAM LEADERSHIP","团队搭建与协作","明确标准与反馈机制，让创意、效率和团队成长同时发生。"],
  ["03","PIPELINE","管线与品质管理","打通设计、制作、引擎到验收的全流程品质闭环。"],
  ["04","VISUAL STORYTELLING","角色与世界观塑造","用造型、色彩与叙事细节，构建鲜明且可信的游戏世界。"],
];

export default function Home() {
  const [filter, setFilter] = useState("全部");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openProject, setOpenProject] = useState<string | null>(null);
  const tags = ["全部", "视频动画", "角色设计", "概念设计", "UI视觉", "场景设计", "宣传视觉", "制作管理"];
  const visibleWorks = useMemo(() => filter === "全部" ? works : works.filter((work) => work.tag === filter), [filter]);
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
  const projectWorks = useMemo(() => openProject ? works.filter((work) => work.project === openProject) : [], [openProject]);
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
          <a className="brand" href="#top" aria-label="Jason Zhang home">JZ<span>.</span></a>
          <nav aria-label="主导航"><a href="#experience">经历</a><a href="#projects">项目</a><a href="#strengths">优势</a><a href="#works">作品</a></nav>
          <a className="contact-link" href="#contact">联系我 <span>↗</span></a>
        </header>
        <div className="hero-content shell">
          <p className="eyebrow"><span /> GAME ART DIRECTOR · PORTFOLIO</p>
          <h1>CREATING<br />WORLDS<span>.</span></h1>
          <div className="hero-bottom"><p>游戏美术总监 / 主美<br />以视觉叙事，构建值得沉浸的世界</p><div className="hero-metrics"><span><b>8+</b> 主要项目</span><span><b>4</b> 风格跨度</span><span><b>360°</b> 全流程</span></div><a href="#experience" className="scroll-cue"><span>↓</span> SCROLL TO EXPLORE</a></div>
        </div>
        <div className="hero-showcase" aria-label="精选项目快速预览"><div className="hero-showcase-track">{[...projects, ...projects].map((project, index) => <button key={`${project.no}-${index}`} onClick={() => setOpenProject(project.folder)}><img src={asset(projectCover(project))} alt="" /><span>{project.title}</span></button>)}</div></div>
        <div className="hero-index">01 <span>/</span> 05</div>
      </section>

      <section className="about section shell" id="experience">
        <div className="section-head" data-reveal><p>01 / ABOUT & EXPERIENCE</p><p>SHENZHEN · CHINA</p></div>
        <div className="about-grid">
          <div className="portrait-wrap" data-reveal data-tilt><img src={asset("/portrait-art.png")} alt="角色美术作品" /><span className="portrait-label">SELECTED CHARACTER ART</span></div>
          <div className="intro" data-reveal data-tilt>
            <p className="eyebrow dark"><span /> HELLO, I&apos;M JASON</p>
            <h2>让美术成为<br />产品的<span>核心竞争力</span></h2>
            <p className="intro-copy">我是一名游戏美术总监 / 主美，专注于风格化角色、世界观视觉与项目美术管线。我相信好的美术不只是「好看」，它要服务体验、支撑商业目标，也能让团队看见同一个方向。</p>
            <div className="facts"><div><b>8+</b><span>主要项目</span></div><div><b>4</b><span>品类 / 风格跨度</span></div><div><b>360°</b><span>全流程美术管理</span></div></div>
            <div className="resume-note">当前为作品素材推导的基础版履历；补充简历后将更新精确年份、职级与量化成果。</div>
          </div>
        </div>
        <div className="timeline">
          {experiences.map((item, index) => <article className="timeline-row" data-reveal data-tilt key={item.company}>
            <span className="timeline-no">0{index + 1}</span><img src={asset(item.logo)} alt={`${item.company} logo`} />
            <div><h3>{item.company}</h3><p>{item.project}</p></div><div><strong>{item.role}</strong><p>{item.desc}</p></div>
          </article>)}
        </div>
      </section>

      <section className="projects section" id="projects">
        <div className="shell"><div className="section-head light" data-reveal><p>02 / SELECTED PROJECTS</p><p>2010s — NOW</p></div><div className="title-row" data-reveal><h2>PROJECT<br /><span>ARCHIVE</span></h2><p>跨越卡牌、MMO、MOBA 与国风仙侠<br />从视觉定位到最终落地的项目实践</p></div>
          <div className="project-grid">{projects.map(project => <button type="button" className="project-card" data-reveal data-tilt key={project.no} onClick={() => { setOpenProject(project.folder); setSelectedId(null); }} aria-label={`查看 ${project.title} 项目作品`}>
            <img src={asset(projectCover(project))} alt={`${project.title} 项目封面`} loading="lazy" /><div className="project-overlay" /><span className="project-no">{project.no}</span><div className="project-copy"><p>{project.type}</p><h3>{project.title}</h3><span>{project.cn} · {works.filter((work) => work.project === project.folder).length} WORKS</span></div><span className="card-arrow">↗</span>
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
          <div className="works-top" data-reveal><div><h2>WORKS<span>.</span></h2><p className="work-count">{String(visibleWorks.length).padStart(3, "0")} / {String(works.length).padStart(3, "0")} WORKS</p></div><div className="filters" role="group" aria-label="作品类别筛选">{tags.map(tag => <button className={filter === tag ? "active" : ""} onClick={() => { setFilter(tag); setSelectedId(null); }} key={tag}>{tag}</button>)}</div></div>
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
          <div className="contact-bottom"><div><p>期待与你聊聊下一个值得被看见的世界。</p><p className="contact-placeholder">请提供简历中的邮箱 / 电话 / 微信，我会在此替换。</p></div><a href="#top" aria-label="回到顶部">↑</a></div>
        </div>
        <div className="footer-line shell"><span>© 2026 JASON ZHANG</span><span>GAME ART DIRECTOR · PORTFOLIO</span></div>
      </footer>
    </main>
  );
}
