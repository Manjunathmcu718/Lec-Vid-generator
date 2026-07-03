import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/standaloneClient";
import { motion } from "framer-motion";
import {
  Clapperboard, Search, Plus, Play, Clock, FileText, Video,
  LayoutGrid, List, ArrowRight, Loader2, Film
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RenderProgress from "../components/RenderProgress";
import moment from "moment";

export default function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => appClient.entities.Project.list("-created_date", 100),
  });

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchesQuery = !query ||
        p.title?.toLowerCase().includes(query.toLowerCase()) ||
        p.file_name?.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [projects, query, statusFilter]);

  const stats = useMemo(() => ({
    total: projects.length,
    ready: projects.filter(p => p.status === "ready").length,
    processing: projects.filter(p => p.status === "extracting" || p.status === "generating").length,
    scenes: projects.reduce((sum, p) => sum + (p.scene_count || 0), 0),
  }), [projects]);

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#050507]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Clapperboard className="w-5 h-5 text-black" />
            </div>
            <div className="leading-none">
              <h1 className="text-lg font-black tracking-tight font-[var(--font-space)]">LectureAI</h1>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-mono">LIBRARY · ARCHIVE</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="rounded-full text-white/60 hover:text-white hover:bg-white/5">
                Home
              </Button>
            </Link>
            <Button onClick={() => navigate("/")} className="rounded-full gap-2 bg-white text-black hover:bg-white/90 font-bold">
              <Plus className="w-4 h-4" /> New Reel
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-8">
        {/* Page title + stats */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">01 — ARCHIVE</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black font-[var(--font-space)] tracking-tight mb-6">
            Your <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">Lecture Library</span>
          </h2>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Film} label="Total Reels" value={stats.total} color="#f0c040" />
            <StatCard icon={Play} label="Ready to Watch" value={stats.ready} color="#4ade80" />
            <StatCard icon={Loader2} label="Processing" value={stats.processing} color="#fb923c" spin={stats.processing > 0} />
            <StatCard icon={Video} label="Total Scenes" value={stats.scenes} color="#60a5fa" />
          </div>
        </div>

        {/* Toolbar: search, filter, view toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by title or filename..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-11"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-white/5 border border-white/10 p-1">
              {["all", "ready", "processing"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    statusFilter === s ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex rounded-xl bg-white/5 border border-white/10 p-1">
              <button onClick={() => setView("grid")}
                className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-white/10 text-amber-400" : "text-white/40 hover:text-white/70"}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")}
                className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-white/10 text-amber-400" : "text-white/40 hover:text-white/70"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
            <p className="text-sm text-white/40 font-mono">Loading your archive...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasProjects={projects.length > 0} query={query} onCreate={() => navigate("/")} />
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p, i) => <GridCard key={p.id} project={p} index={i} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p, i) => <ListRow key={p.id} project={p} index={i} />)}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-5 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">● LECTUREAI · LIBRARY · {new Date().getFullYear()}</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">{filtered.length} REELS</span>
        </div>
      </footer>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, spin }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}1a` }}>
        <Icon className={`w-5 h-5 ${spin ? "animate-spin" : ""}`} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black font-[var(--font-space)] leading-none">{value}</p>
        <p className="text-[10px] uppercase tracking-widest text-white/40 font-mono mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Grid Card ──────────────────────────────────────────────────
function GridCard({ project, index }) {
  const ready = project.status === "ready";
  const processing = project.status === "extracting" || project.status === "generating";
  const thumb = project.scenes?.[0]?.image_url;
  const hasVideo = project.scenes?.some(s => s.video_url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-amber-400/40 transition-all duration-300">
      <Link to={`/project/${project.id}`} className="block">
        <div className="aspect-video relative overflow-hidden bg-black/40">
          {thumb ? (
            <img src={thumb} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {processing ? <Loader2 className="w-8 h-8 text-amber-400/50 animate-spin" /> : <FileText className="w-8 h-8 text-white/20" />}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          {/* Status badge */}
          <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[9px] font-mono uppercase tracking-widest">
            <span className={`w-1.5 h-1.5 rounded-full ${ready ? "bg-green-400" : processing ? "bg-amber-400 animate-pulse" : "bg-red-400"}`} />
            {project.status}
          </span>
          {/* Video badge */}
          {hasVideo && (
            <span className="absolute top-3 right-3 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-black text-[9px] font-black uppercase">
              <Video className="w-2.5 h-2.5" /> Video
            </span>
          )}
          {/* Play overlay */}
          {ready && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center group-hover:bg-amber-400 group-hover:text-black transition-colors">
                <Play className="w-5 h-5 ml-0.5" />
              </div>
            </div>
          )}
        </div>
        <div className="p-4">
          <h4 className="font-bold truncate group-hover:text-amber-400 transition-colors">{project.title}</h4>
          <div className="flex items-center justify-between mt-1.5 text-[11px] text-white/40 font-mono">
            <span>{project.scene_count ? `${project.scene_count} SCENES` : project.file_name?.slice(0, 18)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{moment(project.created_date).fromNow()}</span>
          </div>
        </div>
        <RenderProgress project={project} />
      </Link>
    </motion.div>
  );
}

// ─── List Row ───────────────────────────────────────────────────
function ListRow({ project, index }) {
  const ready = project.status === "ready";
  const processing = project.status === "extracting" || project.status === "generating";
  const thumb = project.scenes?.[0]?.image_url;
  const hasVideo = project.scenes?.some(s => s.video_url);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
      className="group rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 hover:bg-white/[0.05] transition-all">
      <Link to={`/project/${project.id}`} className="flex items-center gap-4 p-3">
        <div className="w-20 h-12 rounded-lg overflow-hidden bg-black/40 shrink-0 relative">
          {thumb ? (
            <img src={thumb} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {processing ? <Loader2 className="w-4 h-4 text-amber-400/50 animate-spin" /> : <FileText className="w-4 h-4 text-white/20" />}
            </div>
          )}
          {ready && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-4 h-4 text-white ml-0.5" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold truncate group-hover:text-amber-400 transition-colors">{project.title}</h4>
          <p className="text-[11px] text-white/40 font-mono truncate">{project.file_name}</p>
        </div>
        {hasVideo && (
          <span className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase">
            <Video className="w-2.5 h-2.5" /> Video
          </span>
        )}
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 text-[9px] font-mono uppercase tracking-widest">
          <span className={`w-1.5 h-1.5 rounded-full ${ready ? "bg-green-400" : processing ? "bg-amber-400 animate-pulse" : "bg-red-400"}`} />
          {project.status}
        </span>
        <span className="hidden sm:block text-[11px] text-white/40 font-mono whitespace-nowrap w-16 text-right">
          {project.scene_count ? `${project.scene_count} sc` : "—"}
        </span>
        <RenderProgress project={project} compact />
        <span className="hidden md:flex items-center gap-1 text-[11px] text-white/40 font-mono whitespace-nowrap w-24 justify-end">
          <Clock className="w-3 h-3" />{moment(project.created_date).fromNow()}
        </span>
        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
      </Link>
    </motion.div>
  );
}

// ─── Empty State ────────────────────────────────────────────────
function EmptyState({ hasProjects, query, onCreate }) {
  return (
    <div className="text-center py-24">
      <div className="w-20 h-20 rounded-3xl bg-amber-400/10 flex items-center justify-center mx-auto mb-6">
        {query ? <Search className="w-8 h-8 text-amber-400/50" /> : <Clapperboard className="w-8 h-8 text-amber-400/50" />}
      </div>
      <h3 className="text-xl font-bold font-[var(--font-space)] mb-2">
        {query ? "No matching reels" : hasProjects ? "Nothing here yet" : "Your library is empty"}
      </h3>
      <p className="text-sm text-white/40 mb-6 max-w-sm mx-auto">
        {query ? `No projects match "${query}". Try a different search.` : "Upload your first lecture notes to create an animated video."}
      </p>
      {!query && (
        <Button onClick={onCreate} className="rounded-full gap-2 bg-gradient-to-r from-amber-300 to-amber-500 text-black hover:opacity-90 font-bold px-6">
          <Plus className="w-4 h-4" /> Create Your First Video
        </Button>
      )}
    </div>
  );
}