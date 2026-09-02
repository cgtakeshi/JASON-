"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import "../app/admin.css";

type MediaType = "image" | "video";

export type PortfolioWork = {
  id: string;
  title: string;
  titleEn?: string;
  tag: string;
  project: string;
  image: string;
  media: MediaType;
  cover: boolean;
  hidden?: boolean;
  width: number;
  height: number;
};

type RepoSettings = {
  owner: string;
  repo: string;
  branch: string;
  token: string;
};

type RepoState = {
  headSha: string;
  treeSha: string;
};

type PendingAsset = {
  file: File;
  data: string;
  preview: string;
  extension: string;
};

const MANIFEST_PATH = "app/portfolio-manifest.json";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const DEFAULT_PROJECTS = [
  "Zodiac Heroes",
  "悠星大陆",
  "决战平安京",
  "大话西游手游",
  "大话西游端游",
  "幻书启示录",
  "轩辕剑·龙舞云山",
  "桃花源记 & 少年仙界传",
  "其他作品",
];
const DEFAULT_TAGS = ["视频动画", "角色设计", "概念设计", "UI视觉", "场景设计", "宣传视觉", "制作管理"];

function previewAsset(path: string) {
  if (!path || path.startsWith("data:") || path.startsWith("http://") || path.startsWith("https://")) return path;
  const config = (window as Window & { __PORTFOLIO_CONFIG__?: { assetBase?: string } }).__PORTFOLIO_CONFIG__;
  const base = config?.assetBase?.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

const emptyWork = (): PortfolioWork => ({
  id: crypto.randomUUID().replaceAll("-", "").slice(0, 12),
  title: "未命名作品",
  titleEn: "Untitled Work",
  tag: DEFAULT_TAGS[0],
  project: DEFAULT_PROJECTS[0],
  image: "",
  media: "image",
  cover: false,
  hidden: true,
  width: 1,
  height: 1,
});

function githubApi(settings: RepoSettings, path: string, init?: RequestInit) {
  return fetch(`https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${settings.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

async function expectJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json() as { message?: string };
      if (body.message) detail = body.message;
    } catch {
      // Keep the HTTP fallback message.
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

function decodeBase64(value: string) {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

async function getRepoState(settings: RepoSettings): Promise<RepoState> {
  const ref = await expectJson<{ object: { sha: string } }>(await githubApi(settings, `/git/ref/heads/${encodeURIComponent(settings.branch)}`));
  const commit = await expectJson<{ tree: { sha: string } }>(await githubApi(settings, `/git/commits/${ref.object.sha}`));
  return { headSha: ref.object.sha, treeSha: commit.tree.sha };
}

async function loadManifest(settings: RepoSettings) {
  const [state, file] = await Promise.all([
    getRepoState(settings),
    expectJson<{ content: string }>(await githubApi(settings, `/contents/${MANIFEST_PATH}?ref=${encodeURIComponent(settings.branch)}`)),
  ]);
  const parsed = JSON.parse(decodeBase64(file.content)) as PortfolioWork[];
  return { state, works: parsed };
}

async function createBlob(settings: RepoSettings, content: string, encoding: "utf-8" | "base64") {
  return expectJson<{ sha: string }>(await githubApi(settings, "/git/blobs", {
    method: "POST",
    body: JSON.stringify({ content, encoding }),
  }));
}

async function commitChanges(
  settings: RepoSettings,
  expectedHead: string,
  works: PortfolioWork[],
  asset?: { path: string; data: string },
  deletePath?: string,
) {
  const current = await getRepoState(settings);
  if (current.headSha !== expectedHead) {
    throw new Error("仓库中已有更新。请刷新后台重新载入后再保存，避免覆盖最新内容。");
  }

  const manifestBlob = await createBlob(settings, `${JSON.stringify(works, null, 2)}\n`, "utf-8");
  const tree: Array<{ path: string; mode: "100644"; type: "blob"; sha: string | null }> = [
    { path: MANIFEST_PATH, mode: "100644", type: "blob", sha: manifestBlob.sha },
  ];

  if (asset) {
    const assetBlob = await createBlob(settings, asset.data, "base64");
    tree.push({ path: asset.path, mode: "100644", type: "blob", sha: assetBlob.sha });
  }
  if (deletePath && deletePath !== asset?.path) {
    tree.push({ path: deletePath, mode: "100644", type: "blob", sha: null });
  }

  const nextTree = await expectJson<{ sha: string }>(await githubApi(settings, "/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: current.treeSha, tree }),
  }));
  const commit = await expectJson<{ sha: string }>(await githubApi(settings, "/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message: `Update portfolio content: ${new Date().toLocaleString("zh-CN", { hour12: false })}`,
      tree: nextTree.sha,
      parents: [current.headSha],
    }),
  }));
  await expectJson(await githubApi(settings, `/git/refs/heads/${encodeURIComponent(settings.branch)}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  }));
  return { headSha: commit.sha, treeSha: nextTree.sha };
}

function getExtension(file: File) {
  const suffix = file.name.split(".").pop()?.toLowerCase();
  if (suffix && /^[a-z0-9]{2,5}$/.test(suffix)) return suffix === "jpeg" ? "jpg" : suffix;
  if (file.type === "video/mp4") return "mp4";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/png") return "png";
  return "jpg";
}

function readFile(file: File): Promise<{ data: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("读取素材失败"));
    reader.onload = () => {
      const preview = String(reader.result);
      resolve({ data: preview.split(",")[1], preview });
    };
    reader.readAsDataURL(file);
  });
}

function getMediaDimensions(preview: string, media: MediaType): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const element = document.createElement(media === "video" ? "video" : "img") as HTMLVideoElement | HTMLImageElement;
    const cleanup = () => { element.removeAttribute("src"); };
    if (media === "video") {
      element.onloadedmetadata = () => {
        const video = element as HTMLVideoElement;
        resolve({ width: video.videoWidth, height: video.videoHeight });
        cleanup();
      };
    } else {
      element.onload = () => {
        const image = element as HTMLImageElement;
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
        cleanup();
      };
    }
    element.onerror = () => { cleanup(); reject(new Error("无法识别素材尺寸")); };
    element.src = preview;
  });
}

export default function PortfolioAdmin() {
  const [settings, setSettings] = useState<RepoSettings>({ owner: "cgtakeshi", repo: "JASON-", branch: "master", token: "" });
  const [repoState, setRepoState] = useState<RepoState | null>(null);
  const [works, setWorks] = useState<PortfolioWork[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PortfolioWork | null>(null);
  const [pendingAsset, setPendingAsset] = useState<PendingAsset | null>(null);
  const [query, setQuery] = useState("");
  const [filterProject, setFilterProject] = useState("全部项目");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const projectOptions = useMemo(() => Array.from(new Set([...DEFAULT_PROJECTS, ...works.map((work) => work.project)])), [works]);
  const tagOptions = useMemo(() => Array.from(new Set([...DEFAULT_TAGS, ...works.map((work) => work.tag)])), [works]);
  const filteredWorks = useMemo(() => works.filter((work) => {
    const matchesProject = filterProject === "全部项目" || work.project === filterProject;
    const keyword = query.trim().toLowerCase();
    const matchesQuery = !keyword || `${work.title} ${work.titleEn ?? ""} ${work.tag}`.toLowerCase().includes(keyword);
    return matchesProject && matchesQuery;
  }), [filterProject, query, works]);

  const connect = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("正在读取作品数据…");
    try {
      const result = await loadManifest(settings);
      setRepoState(result.state);
      setWorks(result.works);
      setSelectedId(result.works[0]?.id ?? null);
      setDraft(result.works[0] ? { ...result.works[0] } : null);
      setMessage(`已连接，共读取 ${result.works.length} 条作品内容。`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "连接失败");
      setMessage("");
    } finally { setBusy(false); }
  };

  const selectWork = (work: PortfolioWork) => {
    setSelectedId(work.id); setDraft({ ...work }); setPendingAsset(null); setError(""); setMessage("");
  };

  const createWork = () => {
    const next = emptyWork();
    setSelectedId(next.id); setDraft(next); setPendingAsset(null); setError(""); setMessage("新作品默认为草稿，请补充内容和素材后保存。");
  };

  const onAssetChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !draft) return;
    setError("");
    if (file.size > MAX_FILE_SIZE) {
      setError("素材超过 20MB，请压缩后重新上传。");
      event.target.value = "";
      return;
    }
    const media: MediaType = file.type.startsWith("video/") ? "video" : "image";
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("仅支持图片或视频素材。");
      return;
    }
    try {
      const read = await readFile(file);
      const dimensions = await getMediaDimensions(read.preview, media);
      setPendingAsset({ file, ...read, extension: getExtension(file) });
      setDraft({ ...draft, media, width: dimensions.width, height: dimensions.height });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "素材读取失败");
    }
  };

  const save = async () => {
    if (!draft || !repoState) return;
    if (!draft.title.trim() || !draft.project.trim() || !draft.tag.trim()) {
      setError("作品名称、所属项目和分类不能为空。");
      return;
    }
    if (!draft.image && !pendingAsset) {
      setError("请先上传作品素材。");
      return;
    }
    setBusy(true); setError(""); setMessage("正在发布更新…");
    try {
      const existing = works.find((work) => work.id === draft.id);
      const nextImage = pendingAsset ? `/portfolio/work-${draft.id}.${pendingAsset.extension}` : draft.image;
      const normalized = { ...draft, title: draft.title.trim(), titleEn: draft.titleEn?.trim() || undefined, image: nextImage };
      const nextWorks = existing ? works.map((work) => work.id === draft.id ? normalized : work) : [...works, normalized];
      const oldPath = pendingAsset && existing?.image.startsWith("/portfolio/") ? existing.image.slice(1) : undefined;
      const state = await commitChanges(
        settings,
        repoState.headSha,
        nextWorks,
        pendingAsset ? { path: nextImage.slice(1), data: pendingAsset.data } : undefined,
        oldPath,
      );
      setRepoState(state); setWorks(nextWorks); setDraft(normalized); setPendingAsset(null);
      setMessage("保存成功。Cloudflare 将自动重新构建，通常 1–3 分钟后前台更新。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存失败");
      setMessage("");
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!draft || !repoState || !works.some((work) => work.id === draft.id)) return;
    if (!window.confirm(`确认删除“${draft.title}”？该操作会提交到 GitHub，但仍可通过版本记录恢复。`)) return;
    setBusy(true); setError(""); setMessage("正在删除…");
    try {
      const nextWorks = works.filter((work) => work.id !== draft.id);
      const deletePath = draft.image.startsWith("/portfolio/") ? draft.image.slice(1) : undefined;
      const state = await commitChanges(settings, repoState.headSha, nextWorks, undefined, deletePath);
      setRepoState(state); setWorks(nextWorks); setSelectedId(nextWorks[0]?.id ?? null); setDraft(nextWorks[0] ? { ...nextWorks[0] } : null);
      setPendingAsset(null); setMessage("作品已删除并提交更新。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "删除失败"); setMessage("");
    } finally { setBusy(false); }
  };

  const move = async (direction: -1 | 1) => {
    if (!draft || !repoState) return;
    const index = works.findIndex((work) => work.id === draft.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= works.length) return;
    const nextWorks = [...works];
    [nextWorks[index], nextWorks[target]] = [nextWorks[target], nextWorks[index]];
    setBusy(true); setError(""); setMessage("正在更新排序…");
    try {
      const state = await commitChanges(settings, repoState.headSha, nextWorks);
      setRepoState(state); setWorks(nextWorks); setMessage("作品顺序已更新。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "排序失败"); setMessage("");
    } finally { setBusy(false); }
  };

  const reload = async () => {
    setBusy(true); setError("");
    try {
      const result = await loadManifest(settings);
      setRepoState(result.state); setWorks(result.works);
      const selected = result.works.find((work) => work.id === selectedId) ?? result.works[0];
      setSelectedId(selected?.id ?? null); setDraft(selected ? { ...selected } : null); setPendingAsset(null);
      setMessage("已载入 GitHub 中的最新内容。");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "刷新失败"); }
    finally { setBusy(false); }
  };

  if (!repoState) {
    return <main className="admin-login">
      <section className="admin-login-card">
        <div className="admin-brand"><span>JZ</span><p>PORTFOLIO<br />CONTENT STUDIO</p></div>
        <p className="admin-kicker">PRIVATE CONTENT MANAGEMENT</p>
        <h1>作品集<br /><em>内容后台</em></h1>
        <p className="admin-login-copy">连接个人站 GitHub 仓库后，可编辑作品信息、排序、上下架并替换图片或视频。令牌只存在于当前页面内，关闭页面后即清除。</p>
        <form onSubmit={connect} className="admin-connect-form">
          <div className="admin-repo-row"><label>GitHub 用户名<input value={settings.owner} onChange={(event) => setSettings({ ...settings, owner: event.target.value })} /></label><label>仓库<input value={settings.repo} onChange={(event) => setSettings({ ...settings, repo: event.target.value })} /></label><label>分支<input value={settings.branch} onChange={(event) => setSettings({ ...settings, branch: event.target.value })} /></label></div>
          <label>GitHub 访问令牌<input type="password" autoComplete="off" value={settings.token} onChange={(event) => setSettings({ ...settings, token: event.target.value })} placeholder="github_pat_..." required /></label>
          <p className="admin-help">令牌只需授予该仓库的 <b>Contents: Read and write</b> 权限。</p>
          {error && <p className="admin-alert error">{error}</p>}
          {message && <p className="admin-alert">{message}</p>}
          <button className="admin-primary" disabled={busy}>{busy ? "正在连接…" : "进入内容后台 →"}</button>
        </form>
        <a className="admin-token-link" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">创建 GitHub 精细访问令牌 ↗</a>
        <a className="admin-back" href="/">← 返回个人站</a>
      </section>
    </main>;
  }

  return <main className="admin-shell">
    <header className="admin-header">
      <div className="admin-brand"><span>JZ</span><p>PORTFOLIO<br />CONTENT STUDIO</p></div>
      <div className="admin-header-center"><span className="admin-live-dot" /> CONNECTED TO GITHUB <b>{settings.owner}/{settings.repo}</b></div>
      <nav><a href="/" target="_blank">预览网站 ↗</a><button onClick={reload} disabled={busy}>刷新数据</button></nav>
    </header>

    <section className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title"><div><span>WORKS</span><b>{works.length}</b></div><button onClick={createWork}>＋ 新增作品</button></div>
        <div className="admin-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索作品名称…" /><select value={filterProject} onChange={(event) => setFilterProject(event.target.value)}><option>全部项目</option>{projectOptions.map((project) => <option key={project}>{project}</option>)}</select></div>
        <div className="admin-work-list">
          {filteredWorks.map((work, index) => <button key={work.id} className={selectedId === work.id ? "active" : ""} onClick={() => selectWork(work)}>
            <span className="admin-thumb">{work.media === "video" ? <video src={previewAsset(work.image)} muted /> : <img src={previewAsset(work.image)} alt="" />}</span>
            <span><b>{work.title}</b><small>{work.project} · {work.tag}</small></span>
            <i className={work.hidden ? "draft" : "published"}>{work.hidden ? "草稿" : "展示中"}</i><em>{String(index + 1).padStart(3, "0")}</em>
          </button>)}
          {!filteredWorks.length && <p className="admin-empty">没有符合条件的作品</p>}
        </div>
      </aside>

      <section className="admin-editor">
        {draft ? <>
          <div className="admin-editor-head"><div><p>EDIT WORK / {draft.id}</p><h1>{draft.title}</h1></div><div className="admin-order"><button onClick={() => move(-1)} disabled={busy}>↑ 前移</button><button onClick={() => move(1)} disabled={busy}>↓ 后移</button></div></div>
          <div className="admin-editor-grid">
            <div className="admin-media-panel">
              <div className="admin-media-preview" style={{ aspectRatio: `${draft.width || 1}/${draft.height || 1}` }}>
                {pendingAsset ? (draft.media === "video" ? <video src={pendingAsset.preview} controls /> : <img src={pendingAsset.preview} alt="待上传预览" />) : draft.image ? (draft.media === "video" ? <video src={previewAsset(draft.image)} controls /> : <img src={previewAsset(draft.image)} alt={draft.title} />) : <span>等待上传素材</span>}
              </div>
              <label className="admin-upload"><input type="file" accept="image/*,video/mp4,video/webm" onChange={onAssetChange} /><b>替换 / 上传素材</b><span>图片或视频 · 单个文件不超过 20MB</span></label>
              <dl><div><dt>素材类型</dt><dd>{draft.media === "video" ? "视频" : "图片"}</dd></div><div><dt>原始尺寸</dt><dd>{draft.width} × {draft.height}</dd></div><div><dt>前台比例</dt><dd>按素材原始比例</dd></div></dl>
            </div>

            <form className="admin-fields" onSubmit={(event) => { event.preventDefault(); void save(); }}>
              <div className="admin-field-row"><label>中文名称<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label>英文名称<input value={draft.titleEn ?? ""} onChange={(event) => setDraft({ ...draft, titleEn: event.target.value })} placeholder="可选；留空则沿用中文名称" /></label></div>
              <div className="admin-field-row"><label>所属项目<select value={draft.project} onChange={(event) => setDraft({ ...draft, project: event.target.value })}>{projectOptions.map((project) => <option key={project}>{project}</option>)}</select></label><label>作品分类<select value={draft.tag} onChange={(event) => setDraft({ ...draft, tag: event.target.value })}>{tagOptions.map((tag) => <option key={tag}>{tag}</option>)}</select></label></div>
              <label>素材地址<input value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} placeholder="上传素材后自动生成，也可以填写已有路径" /></label>
              <div className="admin-switches">
                <label><input type="checkbox" checked={!draft.hidden} onChange={(event) => setDraft({ ...draft, hidden: !event.target.checked })} /><span /><b>在前台展示</b><small>关闭后作为草稿保留</small></label>
                <label><input type="checkbox" checked={draft.cover} onChange={(event) => setDraft({ ...draft, cover: event.target.checked })} /><span /><b>设为项目封面</b><small>封面不会出现在作品列表</small></label>
              </div>
              {error && <p className="admin-alert error">{error}</p>}
              {message && <p className="admin-alert">{message}</p>}
              <div className="admin-actions"><button type="button" className="admin-delete" onClick={remove} disabled={busy || !works.some((work) => work.id === draft.id)}>删除作品</button><button className="admin-primary" disabled={busy}>{busy ? "正在处理…" : "保存并发布更新 →"}</button></div>
            </form>
          </div>
        </> : <div className="admin-empty-editor"><span>JZ</span><h1>选择一件作品开始编辑</h1></div>}
      </section>
    </section>
  </main>;
}
