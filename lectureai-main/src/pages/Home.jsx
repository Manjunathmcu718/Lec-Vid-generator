import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/standaloneClient";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Plus, Upload, Wand2, Clapperboard, Play, ArrowRight, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUploader from "../components/FileUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import moment from "moment";

const MARQUEE_WORDS = ["ANIMATED", "EXPLAINED", "VISUALIZED", "DERIVED", "NARRATED", "TEACH", "LEARN", "REPLAY"];

const STEPS = [
  { n: "01", icon: Upload, title: "Upload", desc: "Drop your PDFs, PPTs, or lecture notes." },
  { n: "02", icon: FileText, title: "Extract", desc: "AI reads and understands every concept." },
  { n: "03", icon: Wand2, title: "Animate", desc: "Formulas derive, diagrams move, voices narrate." },
  { n: "04", icon: Play, title: "Play", desc: "Watch a cinematic lesson that actually teaches." },
];

export default function Home() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => appClient.entities.Project.list("-created_date", 50),
  });

  const handleCreate = async () => {
    if (!file) return;
    setLoading(true);
    const { file_url } = await appClient.integrations.Core.UploadFile({ file });
    const project = await appClient.entities.Project.create({
      title: title || file.name.replace(/\.[^.]+$/, ""),
      status: "extracting",
      file_url,
      file_name: file.name,
    });
    setOpen(false);
    setLoading(false);
    navigate(`/project/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white overflow-x-hidden">
      {/* Film grain overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] z-50 mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#050507]/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Clapperboard className="w-5 h-5 text-black" />
            </div>
            <div className="leading-none">
              <h1 className="text-lg font-black tracking-tight font-[var(--font-space)]">LectureAI</h1>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-mono">EDU · CINEMA</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {projects.length > 0 && (
              <Link to="/dashboard" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white transition-colors px-3 h-9 rounded-full hover:bg-white/5">
                Library
              </Link>
            )}
            <Button onClick={() => setOpen(true)} className="rounded-full gap-2 bg-white text-black hover:bg-white/90 font-bold">
              <Plus className="w-4 h-4" /> New Reel
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        {/* BG image */}
        <div className="absolute inset-0 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&q=80"
            alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/60 via-[#050507]/85 to-[#050507]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 md:pt-28 md:pb-32">
          {/* Technical labels */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest">
              <motion.span className="w-1.5 h-1.5 rounded-full bg-red-500"
                animate={{ opacity: [1,0.2,1] }} transition={{ repeat: Infinity, duration: 1.4 }} />
              Now Showing
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">TAKE 01 · ROLL A · 24FPS</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 hidden sm:inline">2.39:1 — ANAMORPHIC</span>
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-[12vw] sm:text-7xl md:text-8xl font-black leading-[0.92] tracking-tight font-[var(--font-space)]">
            Turn notes into<br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 bg-clip-text text-transparent">animated lessons</span>
          </motion.h2>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-6 max-w-xl text-base md:text-lg text-white/55 leading-relaxed">
            Upload your lecture notes, PDFs, or presentations. AI reads them, writes a teaching script, and renders
            a cinematic animated video — formulas derive step by step, diagrams move, and a voice narrates it all.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => setOpen(true)}
              className="rounded-full gap-2 bg-gradient-to-r from-amber-300 to-amber-500 text-black hover:opacity-90 font-bold px-7 h-12 text-base shadow-xl shadow-amber-500/20">
              <Sparkles className="w-5 h-5" /> Create Your First Video
            </Button>
            {projects.length > 0 && (
              <Link to="/dashboard" className="group flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors px-4 h-12">
                View Archive <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </motion.div>

          {/* scroll hint */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="mt-20 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/30">
            <ArrowRight className="w-3 h-3 rotate-90" /> Scroll · Cut to next scene
          </motion.div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="relative border-y border-white/10 bg-gradient-to-r from-amber-500/5 via-transparent to-orange-500/5 py-4 overflow-hidden">
        <motion.div className="flex gap-8 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }}>
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS, ...MARQUEE_WORDS, ...MARQUEE_WORDS].map((w, i) => (
            <span key={i} className="text-2xl md:text-3xl font-black tracking-tight font-[var(--font-space)] flex items-center gap-8">
              {w} <span className="text-amber-400">✦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="flex items-center gap-3 mb-10">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">02 — THE PROCESS</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <h3 className="text-3xl md:text-5xl font-black font-[var(--font-space)] mb-12 max-w-2xl">
          From <span className="text-white/40">dead notes</span> to a living lesson.
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 hover:bg-white/[0.05] transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-4xl font-black text-white/10 font-[var(--font-space)] group-hover:text-amber-400/30 transition-colors">{s.n}</span>
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center group-hover:bg-amber-400/20 transition-colors">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <h4 className="text-lg font-bold mb-1.5">{s.title}</h4>
                <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ARCHIVE */}
      {projects.length > 0 && (
        <section id="archive" className="max-w-6xl mx-auto px-5 pb-24">
          <div className="flex items-center gap-3 mb-8">
            <motion.span className="w-2 h-2 rounded-full bg-red-500"
              animate={{ opacity: [1,0.2,1] }} transition={{ repeat: Infinity, duration: 1.4 }} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">03 — ARCHIVE · {projects.length} REELS</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => <ArchiveCard key={p.id} project={p} />)}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap items-center justify-between gap-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">● LECTUREAI · EDU CINEMA · {new Date().getFullYear()}</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">RENDERED FRAME BY FRAME</span>
        </div>
      </footer>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg bg-[#0c0c0f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-[var(--font-space)] flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-amber-400" /> New Reel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input placeholder="Video title (optional)" value={title} onChange={e => setTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" />
            <FileUploader onFileSelect={setFile} disabled={loading} />
            <Button className="w-full rounded-xl gap-2 bg-gradient-to-r from-amber-300 to-amber-500 text-black hover:opacity-90 font-bold"
              disabled={!file || loading} onClick={handleCreate}>
              {loading ? (
                <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Processing...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Video</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ArchiveCard({ project }) {
  const statusColor = project.status === "ready" ? "text-green-400" : "text-amber-400";
  return (
    <motion.div whileHover={{ y: -4 }}
      className="text-left block w-full group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-amber-400/40 transition-all duration-300">
      <Link to={`/project/${project.id}`} className="block">
        <div className="aspect-video relative overflow-hidden bg-black/40">
          {project.scenes?.[0]?.image_url ? (
            <img src={project.scenes[0].image_url} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[9px] font-mono uppercase tracking-widest">
            <span className={`w-1.5 h-1.5 rounded-full ${project.status === "ready" ? "bg-green-400" : "bg-amber-400"}`} />
            {project.status}
          </span>
          {project.status === "ready" && (
            <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center group-hover:bg-amber-400 group-hover:text-black transition-colors">
              <Play className="w-4 h-4 ml-0.5" />
            </span>
          )}
        </div>
        <div className="p-4">
          <h4 className="font-bold truncate group-hover:text-amber-400 transition-colors">{project.title}</h4>
          <div className="flex items-center justify-between mt-1.5 text-[11px] text-white/40 font-mono">
            <span>{project.scene_count ? `${project.scene_count} SCENES` : project.file_name?.slice(0, 18)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{moment(project.created_date).fromNow()}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}