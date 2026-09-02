"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type { PortfolioWork } from "./portfolio-types";
import "../app/admin.css";

type MediaType = "image" | "video";
type AdminState = { version: string };
type PendingAsset = { file: File; data: string; preview: string; extension: string; mime: string };

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const DEFAULT_PROJECTS = ["Zodiac Heroes", "悠星大陆", "决战平安京", "大话西游手游", "大话西游端游", "幻书启示录", "轩辕剑·龙舞云山", "桃花源记 & 少年仙界传", "其他作品"];
const DEFAULT_TAGS = ["视频动画", "角色设计", "概念设计", "UI视觉", "场景设计", "宣传视觉", "制作管理"];

function previewAsset(path: string) {
  if (!path || path.startsWith("data:") || /^https?:\/\//.test(path)) return path;
  const config = (window as Window & { __PORTFOLIO_CONFIG__?: { assetBase?: string } }).__PORTFOLIO_CONFIG__;
  const base = config?.assetBase?.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

const emptyWork = (): PortfolioWork => ({
  id: crypto.randomUUID().replaceAll("-", "").slice(0, 12), title: "未命名作品", titleEn: "Untitled Work",
  tag: DEFAULT_TAGS[0], project: DEFAULT_PROJECTS[0], image: "", media: "image", cover: false, hidden: true, width: 1, height: 1,
});

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin${path}`, { ...init, credentials: "same-origin", headers: { "Content-Type": "application/json", ...init?.headers } });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try { const body = await response.json() as { message?: string }; if (body.message) message = body.message; } catch { /* Keep HTTP fallback. */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

function getExtension(file: File) {
  const suffix = file.name.split(".").pop()?.toLowerCase();
  if (suffix && /^(webp|png|jpg|jpeg|gif|mp4|webm)$/.test(suffix)) return suffix === "jpeg" ? "jpg" : suffix;
  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/webm") return "webm";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/png") return "png";
  return "jpg";
}

function readFile(file: File): Promise<{ data: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("读取素材失败"));
    reader.onload = () => { const preview = String(reader.result); resolve({ data: preview.split(",")[1], preview }); };
    reader.readAsDataURL(file);
  });
}

function getMediaDimensions(preview: string, media: MediaType): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const element = document.createElement(media === "video" ? "video" : "img") as HTMLVideoElement | HTMLImageElement;
    const cleanup = () => element.removeAttribute("src");
    if (media === "video") element.onloadedmetadata = () => { const video = element as HTMLVideoElement; resolve({ width: video.videoWidth, height: video.videoHeight }); cleanup(); };
    else element.onload = () => { const image = element as HTMLImageElement; resolve({ width: image.naturalWidth, height: image.naturalHeight }); cleanup(); };
    element.onerror = () => { cleanup(); reject(new Error("无法识别素材尺寸")); };
    element.src = preview;
  });
}

export default function PortfolioAdminEcs() {
  const [password, setPassword] = useState("");
  const [adminState, setAdminState] = useState<AdminState | null>(null);
  const [works, setWorks] = useState<PortfolioWork[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PortfolioWork | null>(null);
  const [pendingAsset, setPendingAsset] = useState<PendingAsset | null>(null);
  const [query, setQuery] = useState("");
  const [filterProject, setFilterProject] = useState("全部项目");
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const applyLoaded = (result: { version: string; works: PortfolioWork[] }, preferredId?: string | null) => {
    setAdminState({ version: result.version }); setWorks(result.works);
    const selected = result.works.find((work) => work.id === preferredId) ?? result.works[0];
    setSelectedId(selected?.id ?? null); setDraft(selected ? { ...selected } : null); setPendingAsset(null);
  };

  useEffect(() => { api<{ version: string; works: PortfolioWork[] }>("/works").then((result) => applyLoaded(result)).catch(() => undefined).finally(() => setCheckingSession(false)); }, []);

  const projectOptions = useMemo(() => Array.from(new Set([...DEFAULT_PROJECTS, ...works.map((work) => work.project)])), [works]);
  const tagOptions = useMemo(() => Array.from(new Set([...DEFAULT_TAGS, ...works.map((work) => work.tag)])), [works]);
  const filteredWorks = useMemo(() => works.filter((work) => {
    const keyword = query.trim().toLowerCase();
    return (filterProject === "全部项目" || work.project === filterProject) && (!keyword || `${work.title} ${work.titleEn ?? ""} ${work.tag}`.toLowerCase().includes(keyword));
  }), [filterProject, query, works]);

  const connect = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("正在验证并读取 ECS 数据…");
    try { const result = await api<{ version: string; works: PortfolioWork[] }>("/login", { method: "POST", body: JSON.stringify({ password }) }); applyLoaded(result); setPassword(""); setMessage(`登录成功，共读取 ${result.works.length} 条作品内容。`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "登录失败"); setMessage(""); }
    finally { setBusy(false); }
  };

  const persist = async (nextWorks: PortfolioWork[], asset?: PendingAsset & { path: string }, deletePath?: string) => {
    if (!adminState) throw new Error("登录会话已失效，请重新登录。");
    return api<{ version: string; works: PortfolioWork[] }>("/works", { method: "PUT", body: JSON.stringify({ version: adminState.version, works: nextWorks, asset: asset ? { path: asset.path, data: asset.data, mime: asset.mime } : undefined, deletePath }) });
  };

  const selectWork = (work: PortfolioWork) => { setSelectedId(work.id); setDraft({ ...work }); setPendingAsset(null); setError(""); setMessage(""); };
  const createWork = () => { const next = emptyWork(); setSelectedId(next.id); setDraft(next); setPendingAsset(null); setError(""); setMessage("新作品默认为草稿，请补充内容和素材后保存。"); };

  const onAssetChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file || !draft) return; setError("");
    if (file.size > MAX_FILE_SIZE) { setError("素材超过 20MB，请压缩后重新上传。"); event.target.value = ""; return; }
    const media: MediaType = file.type.startsWith("video/") ? "video" : "image";
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) { setError("仅支持图片或视频素材。"); return; }
    try { const read = await readFile(file); const dimensions = await getMediaDimensions(read.preview, media); setPendingAsset({ file, ...read, extension: getExtension(file), mime: file.type }); setDraft({ ...draft, media, width: dimensions.width, height: dimensions.height }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "素材读取失败"); }
  };

  const save = async () => {
    if (!draft || !adminState) return;
    if (!draft.title.trim() || !draft.project.trim() || !draft.tag.trim()) { setError("作品名称、所属项目和分类不能为空。"); return; }
    if (!draft.image && !pendingAsset) { setError("请先上传作品素材。"); return; }
    setBusy(true); setError(""); setMessage("正在写入 ECS…");
    try {
      const existing = works.find((work) => work.id === draft.id);
      const nextImage = pendingAsset ? `/portfolio/work-${draft.id}.${pendingAsset.extension}` : draft.image;
      const normalized = { ...draft, title: draft.title.trim(), titleEn: draft.titleEn?.trim() || undefined, image: nextImage };
      const nextWorks = existing ? works.map((work) => work.id === draft.id ? normalized : work) : [...works, normalized];
      const oldPath = pendingAsset && existing?.image.startsWith("/portfolio/") ? existing.image : undefined;
      const result = await persist(nextWorks, pendingAsset ? { ...pendingAsset, path: nextImage } : undefined, oldPath);
      applyLoaded(result, draft.id); setMessage("保存成功，国内站内容已立即更新。");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "保存失败"); setMessage(""); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!draft || !adminState || !works.some((work) => work.id === draft.id)) return;
    if (!window.confirm(`确认删除“${draft.title}”？服务器会保留内容数据备份。`)) return;
    setBusy(true); setError(""); setMessage("正在从 ECS 删除…");
    try { const result = await persist(works.filter((work) => work.id !== draft.id), undefined, draft.image.startsWith("/portfolio/") ? draft.image : undefined); applyLoaded(result); setMessage("作品已删除，国内站已立即更新。"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "删除失败"); setMessage(""); }
    finally { setBusy(false); }
  };

  const move = async (direction: -1 | 1) => {
    if (!draft || !adminState) return; const index = works.findIndex((work) => work.id === draft.id); const target = index + direction;
    if (index < 0 || target < 0 || target >= works.length) return;
    const nextWorks = [...works]; [nextWorks[index], nextWorks[target]] = [nextWorks[target], nextWorks[index]];
    setBusy(true); setError(""); setMessage("正在更新排序…");
    try { const result = await persist(nextWorks); applyLoaded(result, draft.id); setMessage("作品顺序已更新。"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "排序失败"); setMessage(""); }
    finally { setBusy(false); }
  };

  const reload = async () => { setBusy(true); setError(""); try { const result = await api<{ version: string; works: PortfolioWork[] }>("/works"); applyLoaded(result, selectedId); setMessage("已载入 ECS 中的最新内容。"); } catch (cause) { setError(cause instanceof Error ? cause.message : "刷新失败"); } finally { setBusy(false); } };
  const logout = async () => { try { await api<{ ok: boolean }>("/logout", { method: "POST", body: "{}" }); } catch { /* Local state still signs out. */ } setAdminState(null); setWorks([]); setDraft(null); setSelectedId(null); setMessage(""); setError(""); };

  if (checkingSession) return <main className="admin-login"><section className="admin-login-card"><div className="admin-brand"><span>JZ</span><p>PORTFOLIO<br />CONTENT STUDIO</p></div><p className="admin-kicker">CONNECTING TO DOMESTIC ECS</p><h1>正在载入<br /><em>内容后台</em></h1></section></main>;

  if (!adminState) return <main className="admin-login"><section className="admin-login-card">
    <div className="admin-brand"><span>JZ</span><p>PORTFOLIO<br />CONTENT STUDIO</p></div><p className="admin-kicker">PRIVATE ECS CONTENT MANAGEMENT</p><h1>作品集<br /><em>内容后台</em></h1>
    <p className="admin-login-copy">登录后可直接编辑国内 ECS 上的作品信息和素材。保存后国内站立即更新，不经过 GitHub。</p>
    <form onSubmit={connect} className="admin-connect-form"><label>后台登录密码<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入后台密码" required /></label><p className="admin-help">登录会话使用安全 Cookie，12 小时后自动失效。</p>{error && <p className="admin-alert error">{error}</p>}{message && <p className="admin-alert">{message}</p>}<button className="admin-primary" disabled={busy}>{busy ? "正在登录…" : "进入 ECS 内容后台 →"}</button></form><a className="admin-back" href="/">← 返回个人站</a>
  </section></main>;

  return <main className="admin-shell"><header className="admin-header"><div className="admin-brand"><span>JZ</span><p>PORTFOLIO<br />CONTENT STUDIO</p></div><div className="admin-header-center"><span className="admin-live-dot" /> CONNECTED TO DOMESTIC ECS <b>jasongame.com</b></div><nav><a href="/" target="_blank">预览网站 ↗</a><button onClick={reload} disabled={busy}>刷新数据</button><button onClick={logout}>退出</button></nav></header>
    <section className="admin-layout"><aside className="admin-sidebar"><div className="admin-sidebar-title"><div><span>WORKS</span><b>{works.length}</b></div><button onClick={createWork}>＋ 新增作品</button></div><div className="admin-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索作品名称…" /><select value={filterProject} onChange={(event) => setFilterProject(event.target.value)}><option>全部项目</option>{projectOptions.map((project) => <option key={project}>{project}</option>)}</select></div><div className="admin-work-list">{filteredWorks.map((work, index) => <button key={work.id} className={selectedId === work.id ? "active" : ""} onClick={() => selectWork(work)}><span className="admin-thumb">{work.media === "video" ? <video src={previewAsset(work.image)} muted /> : <img src={previewAsset(work.image)} alt="" />}</span><span><b>{work.title}</b><small>{work.project} · {work.tag}</small></span><i className={work.hidden ? "draft" : "published"}>{work.hidden ? "草稿" : "展示中"}</i><em>{String(index + 1).padStart(3, "0")}</em></button>)}{!filteredWorks.length && <p className="admin-empty">没有符合条件的作品</p>}</div></aside>
      <section className="admin-editor">{draft ? <><div className="admin-editor-head"><div><p>EDIT WORK / {draft.id}</p><h1>{draft.title}</h1></div><div className="admin-order"><button onClick={() => move(-1)} disabled={busy}>↑ 前移</button><button onClick={() => move(1)} disabled={busy}>↓ 后移</button></div></div><div className="admin-editor-grid"><div className="admin-media-panel"><div className="admin-media-preview" style={{ aspectRatio: `${draft.width || 1}/${draft.height || 1}` }}>{pendingAsset ? (draft.media === "video" ? <video src={pendingAsset.preview} controls /> : <img src={pendingAsset.preview} alt="待上传预览" />) : draft.image ? (draft.media === "video" ? <video src={previewAsset(draft.image)} controls /> : <img src={previewAsset(draft.image)} alt={draft.title} />) : <span>等待上传素材</span>}</div><label className="admin-upload"><input type="file" accept="image/*,video/mp4,video/webm" onChange={onAssetChange} /><b>替换 / 上传素材</b><span>直接保存至 ECS · 单个文件不超过 20MB</span></label><dl><div><dt>素材类型</dt><dd>{draft.media === "video" ? "视频" : "图片"}</dd></div><div><dt>原始尺寸</dt><dd>{draft.width} × {draft.height}</dd></div><div><dt>前台比例</dt><dd>按素材原始比例</dd></div></dl></div>
          <form className="admin-fields" onSubmit={(event) => { event.preventDefault(); void save(); }}><div className="admin-field-row"><label>中文名称<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label>英文名称<input value={draft.titleEn ?? ""} onChange={(event) => setDraft({ ...draft, titleEn: event.target.value })} placeholder="可选；留空则沿用中文名称" /></label></div><div className="admin-field-row"><label>所属项目<select value={draft.project} onChange={(event) => setDraft({ ...draft, project: event.target.value })}>{projectOptions.map((project) => <option key={project}>{project}</option>)}</select></label><label>作品分类<select value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: event.target.value })}>{tagOptions.map((tag) => <option key={tag}>{tag}</option>)}</select></label></div><label>素材地址<input value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} placeholder="上传素材后自动生成，也可以填写已有路径" /></label><div className="admin-switches"><label><input type="checkbox" checked={!draft.hidden} onChange={(event) => setDraft({ ...draft, hidden: !event.target.checked })} /><span /><b>在前台展示</b><small>关闭后作为草稿保留</small></label><label><input type="checkbox" checked={draft.cover} onChange={(event) => setDraft({ ...draft, cover: event.target.checked })} /><span /><b>设为项目封面</b><small>封面不会出现在作品列表</small></label></div>{error && <p className="admin-alert error">{error}</p>}{message && <p className="admin-alert">{message}</p>}<div className="admin-actions"><button type="button" className="admin-delete" onClick={remove} disabled={busy || !works.some((work) => work.id === draft.id)}>删除作品</button><button className="admin-primary" disabled={busy}>{busy ? "正在处理…" : "保存到 ECS 并立即更新 →"}</button></div></form></div></> : <div className="admin-empty-editor"><span>JZ</span><h1>选择一件作品开始编辑</h1></div>}</section>
    </section></main>;
}
