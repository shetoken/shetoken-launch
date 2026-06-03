import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Folder, FolderPlus, Upload, Trash2, Download, ExternalLink, Link2, Plus,
  FileText, Image as ImageIcon, Video, FileSpreadsheet, File as FileIcon, Instagram,
  Rss, Inbox, Circle, CheckCheck,
} from "lucide-react";

const BUCKET = "library";

interface FolderRow { id: string; name: string; created_at: string; }
interface ItemRow {
  id: string; folder_id: string | null; kind: string; title: string;
  file_path: string | null; mime: string | null; size: number | null;
  url: string | null; source_type: string | null; notes: string | null;
  feed_url: string | null; tags: string[] | null; status: string | null; last_checked: string | null;
  created_at: string;
}
interface FeedRow { id: string; source_id: string | null; title: string | null; link: string | null; summary: string | null; published_at: string | null; seen: boolean; created_at: string; }

const SOURCE_TYPES = ["Instagram", "X / Twitter", "Facebook", "TikTok", "YouTube", "LinkedIn", "News article", "Website", "Other"];
const splitTags = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

function fmtSize(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
function fileMeta(mime: string | null, title: string) {
  const m = (mime ?? "").toLowerCase();
  const t = title.toLowerCase();
  if (m.startsWith("image/")) return { Icon: ImageIcon, color: "#34d399", label: "Image" };
  if (m.startsWith("video/")) return { Icon: Video, color: "#f472b6", label: "Video" };
  if (m.includes("pdf") || t.endsWith(".pdf")) return { Icon: FileText, color: "#f87171", label: "PDF" };
  if (m.includes("sheet") || m.includes("excel") || t.endsWith(".csv") || t.endsWith(".xlsx") || t.endsWith(".xls")) return { Icon: FileSpreadsheet, color: "#fbbf24", label: "Sheet" };
  if (m.includes("word") || t.endsWith(".doc") || t.endsWith(".docx")) return { Icon: FileText, color: "#60a5fa", label: "Doc" };
  return { Icon: FileIcon, color: "#94a3b8", label: "File" };
}

export function AdminLibrary() {
  const [folderId, setFolderId] = useState<string | null>("ALL"); // "ALL" | null(root) | id
  const [newFolder, setNewFolder] = useState("");
  const [uploading, setUploading] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState({ url: "", title: "", source_type: "Instagram", notes: "", feed_url: "", tags: "", status: "active" });
  const [view, setView] = useState<"lib" | "inbox">("lib");
  const fileRef = useRef<HTMLInputElement>(null);

  const folders = useQuery({
    queryKey: ["library-folders"], staleTime: 30_000,
    queryFn: async (): Promise<FolderRow[]> => {
      const { data, error } = await supabase.from("she_library_folders").select("*").order("name");
      if (error) throw error; return (data ?? []) as FolderRow[];
    },
  });
  const items = useQuery({
    queryKey: ["library-items"], staleTime: 15_000,
    queryFn: async (): Promise<ItemRow[]> => {
      const { data, error } = await supabase.from("she_library_items").select("*").order("created_at", { ascending: false }).limit(5000);
      if (error) throw error; return (data ?? []) as ItemRow[];
    },
  });
  const feed = useQuery({
    queryKey: ["library-feed"], staleTime: 15_000,
    queryFn: async (): Promise<FeedRow[]> => {
      const { data, error } = await supabase.from("she_feed_items").select("*").order("published_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(500);
      if (error) throw error; return (data ?? []) as FeedRow[];
    },
  });
  const unseen = (feed.data ?? []).filter((f) => !f.seen).length;
  const srcName = (id: string | null) => (items.data ?? []).find((i) => i.id === id)?.title ?? "Source";

  async function markSeen(id: string, seen: boolean) {
    const { error } = await supabase.from("she_feed_items").update({ seen }).eq("id", id);
    if (!error) feed.refetch();
  }
  async function markAllSeen() {
    const ids = (feed.data ?? []).filter((f) => !f.seen).map((f) => f.id);
    if (!ids.length) return;
    const { error } = await supabase.from("she_feed_items").update({ seen: true }).in("id", ids);
    if (error) toast.error("Could not update."); else feed.refetch();
  }

  const activeFolder = folderId === "ALL" ? null : folderId;
  const shown = useMemo(() => {
    const list = items.data ?? [];
    if (folderId === "ALL") return list;
    return list.filter((i) => (i.folder_id ?? null) === activeFolder);
  }, [items.data, folderId, activeFolder]);

  async function createFolder() {
    const name = newFolder.trim();
    if (!name) return;
    const { error } = await supabase.from("she_library_folders").insert({ name });
    if (error) toast.error("Could not create folder."); else { toast.success("Folder created."); setNewFolder(""); folders.refetch(); }
  }
  async function deleteFolder(id: string) {
    // delete files in storage first
    const inFolder = (items.data ?? []).filter((i) => i.folder_id === id && i.file_path);
    if (inFolder.length) await supabase.storage.from(BUCKET).remove(inFolder.map((i) => i.file_path!));
    await supabase.from("she_library_items").delete().eq("folder_id", id);
    const { error } = await supabase.from("she_library_folders").delete().eq("id", id);
    if (error) toast.error("Could not delete folder."); else { toast.success("Folder deleted."); if (folderId === id) setFolderId("ALL"); folders.refetch(); items.refetch(); }
  }

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    let ok = 0;
    try {
      for (const file of files) {
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${activeFolder ?? "root"}/${Date.now()}-${safe}`;
        const up = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
        if (up.error) { console.warn(up.error); continue; }
        const ins = await supabase.from("she_library_items").insert({
          folder_id: activeFolder, kind: "file", title: file.name,
          file_path: path, mime: file.type || null, size: file.size,
        });
        if (!ins.error) ok++;
      }
      toast[ok ? "success" : "error"](ok ? `Uploaded ${ok} file${ok === 1 ? "" : "s"}.` : "Upload failed.");
      items.refetch();
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    if (!link.url.trim()) { toast.error("Add a URL."); return; }
    const { error } = await supabase.from("she_library_items").insert({
      folder_id: activeFolder, kind: "link",
      title: link.title.trim() || link.url.trim(), url: link.url.trim(),
      source_type: link.source_type, notes: link.notes.trim() || null,
      feed_url: link.feed_url.trim() || null, tags: splitTags(link.tags), status: link.status,
    });
    if (error) toast.error("Could not save link."); else { toast.success("Link saved."); setLink({ url: "", title: "", source_type: "Instagram", notes: "", feed_url: "", tags: "", status: "active" }); setLinkOpen(false); items.refetch(); }
  }

  async function openFile(item: ItemRow) {
    if (!item.file_path) return;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(item.file_path, 3600);
    if (error || !data?.signedUrl) { toast.error("Could not open file."); return; }
    window.open(data.signedUrl, "_blank");
  }
  async function deleteItem(item: ItemRow) {
    if (item.file_path) await supabase.storage.from(BUCKET).remove([item.file_path]);
    const { error } = await supabase.from("she_library_items").delete().eq("id", item.id);
    if (error) toast.error("Could not delete."); else { toast.success("Removed."); items.refetch(); }
  }

  const folderCount = (id: string | null) => (items.data ?? []).filter((i) => (i.folder_id ?? null) === id).length;

  return (
    <div className="grid lg:grid-cols-4 gap-5 items-start">
      {/* Folder rail */}
      <div className="lg:col-span-1 rounded-2xl border border-border/40 bg-gradient-card p-4 shadow-card space-y-1.5">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2"><Folder className="h-4 w-4 text-accent" /> Folders</h3>
        <button onClick={() => setFolderId("ALL")} className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex justify-between ${folderId === "ALL" ? "bg-accent/15 text-accent" : "hover:bg-muted/30 text-muted-foreground"}`}>
          <span>All items</span><span>{items.data?.length ?? 0}</span>
        </button>
        <button onClick={() => setFolderId(null)} className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex justify-between ${folderId === null ? "bg-accent/15 text-accent" : "hover:bg-muted/30 text-muted-foreground"}`}>
          <span>Unfiled</span><span>{folderCount(null)}</span>
        </button>
        {(folders.data ?? []).map((f) => (
          <div key={f.id} className={`group flex items-center gap-1 rounded-lg ${folderId === f.id ? "bg-accent/15" : "hover:bg-muted/30"}`}>
            <button onClick={() => setFolderId(f.id)} className={`flex-1 text-left text-xs px-2.5 py-1.5 flex justify-between ${folderId === f.id ? "text-accent" : "text-muted-foreground"}`}>
              <span className="truncate">{f.name}</span><span>{folderCount(f.id)}</span>
            </button>
            <button onClick={() => deleteFolder(f.id)} className="opacity-0 group-hover:opacity-100 text-red-400 px-1.5" title="Delete folder"><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
        <div className="flex gap-1.5 pt-2">
          <Input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createFolder()} placeholder="New folder" className="h-8 text-xs bg-background/60 border-border/60" />
          <Button size="sm" onClick={createFolder} className="h-8 px-2 bg-gradient-primary text-primary-foreground border-0"><FolderPlus className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Content */}
      <div className="lg:col-span-3 space-y-4">
        {/* View toggle */}
        <div className="flex gap-1 border-b border-border/40">
          <button onClick={() => setView("lib")} className={`px-3 py-1.5 text-sm border-b-2 -mb-px ${view === "lib" ? "border-accent text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            Files &amp; links
          </button>
          <button onClick={() => setView("inbox")} className={`px-3 py-1.5 text-sm border-b-2 -mb-px flex items-center gap-1.5 ${view === "inbox" ? "border-accent text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Inbox className="h-3.5 w-3.5" /> Inbox {unseen > 0 && <span className="text-[10px] bg-accent/20 text-accent rounded-full px-1.5">{unseen}</span>}
          </button>
        </div>

      {view === "lib" && (<>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" multiple onChange={onFiles} className="hidden" />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="bg-gradient-primary text-primary-foreground border-0">
            <Upload className="mr-2 h-4 w-4" /> {uploading ? "Uploading…" : "Upload files"}
          </Button>
          <Button variant="outline" onClick={() => setLinkOpen((v) => !v)} className="border-border/60 bg-card/40">
            <Link2 className="mr-2 h-4 w-4" /> Add link
          </Button>
          <span className="text-xs text-muted-foreground ml-1">
            into <span className="text-foreground font-medium">{folderId === "ALL" ? "All items" : activeFolder ? (folders.data ?? []).find((f) => f.id === activeFolder)?.name : "Unfiled"}</span>
          </span>
        </div>

        {linkOpen && (
          <form onSubmit={addLink} className="rounded-2xl border border-border/40 bg-gradient-card p-4 shadow-card grid sm:grid-cols-2 gap-3">
            <Input value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} placeholder="URL (e.g. instagram.com/handle) *" className="bg-background/60 border-border/60 sm:col-span-2" />
            <Input value={link.title} onChange={(e) => setLink({ ...link, title: e.target.value })} placeholder="Title / label" className="bg-background/60 border-border/60" />
            <select value={link.source_type} onChange={(e) => setLink({ ...link, source_type: e.target.value })} className="h-10 rounded-md border border-border/60 bg-background/60 px-3 text-sm">
              {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="sm:col-span-2">
              <Input value={link.feed_url} onChange={(e) => setLink({ ...link, feed_url: e.target.value })} placeholder="RSS / Atom feed URL (optional — enables auto-tracking)" className="bg-background/60 border-border/60" />
              <p className="text-[10px] text-muted-foreground mt-1">News sites have an RSS link; YouTube channels: youtube.com/feeds/videos.xml?channel_id=… ; whole-web: make a Google Alert and choose “Deliver to → RSS feed”.</p>
            </div>
            <Input value={link.tags} onChange={(e) => setLink({ ...link, tags: e.target.value })} placeholder="Tags (comma-separated)" className="bg-background/60 border-border/60" />
            <select value={link.status} onChange={(e) => setLink({ ...link, status: e.target.value })} className="h-10 rounded-md border border-border/60 bg-background/60 px-3 text-sm">
              <option value="active">Active</option><option value="watch">Watch</option><option value="archived">Archived</option>
            </select>
            <Input value={link.notes} onChange={(e) => setLink({ ...link, notes: e.target.value })} placeholder="Notes (optional)" className="bg-background/60 border-border/60 sm:col-span-2" />
            <div className="sm:col-span-2"><Button type="submit" className="bg-gradient-primary text-primary-foreground border-0"><Plus className="mr-2 h-4 w-4" /> Save link</Button></div>
          </form>
        )}

        {/* Items grid */}
        {items.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl border border-border/40 bg-gradient-card p-10 text-center shadow-card text-sm text-muted-foreground">
            Nothing here yet. Upload files or add a link.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {shown.map((item) => {
              if (item.kind === "link") {
                const href = item.url!.startsWith("http") ? item.url! : `https://${item.url}`;
                const isInsta = item.source_type === "Instagram";
                return (
                  <div key={item.id} className="rounded-xl border border-border/40 bg-card/40 p-3 shadow-card group">
                    <div className="flex items-start gap-2">
                      {isInsta ? <Instagram className="h-5 w-5 text-pink-400 shrink-0 mt-0.5" /> : <Link2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />}
                      <div className="min-w-0 flex-1">
                        <a href={href} target="_blank" rel="noreferrer" className="text-sm font-semibold hover:underline flex items-center gap-1 truncate">{item.title} <ExternalLink className="h-3 w-3 shrink-0" /></a>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          {item.source_type}
                          {item.feed_url && <span className="text-accent flex items-center gap-0.5"><Rss className="h-2.5 w-2.5" /> tracked</span>}
                        </div>
                        {item.notes && <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.notes}</div>}
                      </div>
                      <button onClick={() => deleteItem(item)} className="opacity-0 group-hover:opacity-100 text-red-400" title="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                );
              }
              const m = fileMeta(item.mime, item.title);
              return (
                <div key={item.id} className="rounded-xl border border-border/40 bg-card/40 p-3 shadow-card group">
                  <div className="flex items-start gap-2">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${m.color}1f`, color: m.color }}><m.Icon className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <button onClick={() => openFile(item)} className="text-sm font-semibold hover:underline text-left truncate block w-full">{item.title}</button>
                      <div className="text-[10px] text-muted-foreground">{m.label}{item.size ? ` · ${fmtSize(item.size)}` : ""}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => openFile(item)} className="text-accent" title="Open / download"><Download className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteItem(item)} className="opacity-0 group-hover:opacity-100 text-red-400" title="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>)}

      {view === "inbox" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Latest items pulled from your RSS / Google-Alert / YouTube feeds. Updated daily.</p>
            {unseen > 0 && <Button size="sm" variant="outline" onClick={markAllSeen} className="border-border/60 bg-card/40 text-xs"><CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Mark all read</Button>}
          </div>
          {feed.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (feed.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-border/40 bg-gradient-card p-10 text-center shadow-card text-sm text-muted-foreground">
              No feed items yet. Add a link with an RSS feed URL, then the daily job (or a manual run) fills this inbox.
            </div>
          ) : (
            <div className="space-y-2">
              {(feed.data ?? []).map((f) => {
                const href = f.link ? (f.link.startsWith("http") ? f.link : `https://${f.link}`) : null;
                return (
                  <div key={f.id} className={`rounded-xl border p-3 shadow-card flex items-start gap-3 ${f.seen ? "border-border/30 bg-card/20 opacity-70" : "border-accent/30 bg-card/40"}`}>
                    <button onClick={() => markSeen(f.id, !f.seen)} className="mt-0.5 shrink-0" title={f.seen ? "Mark unread" : "Mark read"}>
                      {f.seen ? <Circle className="h-3.5 w-3.5 text-muted-foreground" /> : <Circle className="h-3.5 w-3.5 text-accent fill-accent" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-medium text-accent flex items-center gap-1"><Rss className="h-2.5 w-2.5" /> {srcName(f.source_id)}</span>
                        {f.published_at && <span className="text-[10px] text-muted-foreground">{new Date(f.published_at).toLocaleString()}</span>}
                      </div>
                      {href
                        ? <a href={href} target="_blank" rel="noreferrer" onClick={() => markSeen(f.id, true)} className="text-sm font-semibold hover:underline flex items-center gap-1">{f.title || href} <ExternalLink className="h-3 w-3 shrink-0" /></a>
                        : <span className="text-sm font-semibold">{f.title}</span>}
                      {f.summary && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{f.summary}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
