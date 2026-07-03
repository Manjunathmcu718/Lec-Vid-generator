import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/standaloneClient";
import { ArrowLeft, Sparkles, Loader2, RefreshCw, Send, Image, Film, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ScenePlayer from "../components/ScenePlayer";

const GENERATION_STEPS = [
  { label: "Reading your notes...", icon: "📖" },
  { label: "Understanding concepts...", icon: "🧠" },
  { label: "Writing the script...", icon: "✍️" },
  { label: "Generating scene images...", icon: "🎨" },
  { label: "Rendering cinematic video...", icon: "🎬" },
];

export default function ProjectPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(0);
  const [videoGen, setVideoGen] = useState({ active: false, current: 0, total: 0 });

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => appClient.entities.Project.get(id),
    refetchInterval: (query) => {
      const d = query.state.data;
      return d && (d.status === "extracting" || d.status === "generating") ? 2000 : false;
    },
  });

  useEffect(() => {
    if (project?.status === "extracting" && !generating) {
      generateScenes();
    }
  }, [project?.status]);

  const generateScenes = async (customPrompt) => {
    if (generating) return;
    setGenerating(true);
    setStep(0);
    await appClient.entities.Project.update(id, { status: "generating" });

    // Step 1: Extract content
    setStep(0);
    const extracted = await appClient.integrations.Core.ExtractDataFromUploadedFile({
      file_url: project.file_url,
      json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          topics: { type: "array", items: { type: "string" } },
          summary: { type: "string" },
        },
      },
    });

    setStep(1);
    const content = extracted.status === "success"
      ? JSON.stringify(extracted.output)
      : "General educational content";

    const stylePrompt = customPrompt || project.prompt_style || "";

    // Step 2+3: Generate scenes with LLM
    setStep(2);
    const result = await appClient.integrations.Core.InvokeLLM({
      prompt: `You are a master teacher who creates cinematic animated explainers in the style of Neso Academy, 3Blue1Brown, and Khan Academy. You NEVER just state facts — you TEACH by building ideas step by step with a concrete worked example on a blackboard.

DOCUMENT CONTENT:
${content}

${stylePrompt ? "STYLE INSTRUCTION: " + stylePrompt : ""}

Produce 6-8 scenes that together form a complete, self-contained lesson.

=== HARD RULES (VIOLATION = FAILURE) ===

1. EVERY scene MUST contain a real, concrete worked example with actual numbers — never abstract hand-waving.
   - If the topic has a real formula, USE it with real numbers.
   - If the topic is conceptual (definition, analogy, "what is X"), INVENT a tiny concrete numeric example to make it tangible. e.g. for "hashing": formula="h(k) = k mod 7", derivation_steps=["Insert 22: 22 mod 7 = 1 → slot 1", "Insert 30: 30 mod 7 = 2 → slot 2", "Insert 15: 15 mod 7 = 1 → COLLISION!", "Linear probe → slot 2 taken, slot 3 → insert at 3"]

2. derivation_steps: an array of 4-6 strings. Each string is ONE atomic step of a worked calculation or proof and MUST contain an "=" with real numbers, OR a clear "→" transition. No vague sentences allowed.
   - GOOD: ["N=8, M=10 → λ = 8/10 = 0.8", "1/(1−0.8) = 1/0.2 = 5", "expected = (1+5)/2 = 3.0 probes"]
   - FORBIDDEN: ["the formula shows efficiency", "higher load means more probes"]

3. formula: the single core equation as a short string (REQUIRED). If no real formula exists, use the worked-example formula you invented.

4. narration: 3-4 full sentences spoken aloud by a teacher — plain words, no symbols dump, must guide the viewer through the worked example.

5. key_points: exactly 3 crisp bullets.

6. Each scene must flow into the next (scene N builds on scene N-1). Cover: intuition → definition/formula → worked example → result/insight.

Output fields per scene:
- title (≤6 words, punchy)
- narration (3-4 teaching sentences)
- formula (REQUIRED, short)
- derivation_steps (REQUIRED, 4-6 atomic numbered-ish steps with real numbers)
- key_points (exactly 3)
- icon (one emoji)
- image_prompt (detailed, educational, no text in image)`,
      response_json_schema: {
        type: "object",
        properties: {
          scenes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                narration: { type: "string" },
                formula: { type: "string" },
                derivation_steps: { type: "array", items: { type: "string" } },
                key_points: { type: "array", items: { type: "string" } },
                icon: { type: "string" },
                image_prompt: { type: "string" },
              },
            },
          },
        },
      },
    });

    // Step 4: Generate images for each scene in parallel
    setStep(3);
    const scenesWithImages = await Promise.all(
      result.scenes.map(async (scene) => {
        const imgResult = await appClient.integrations.Core.GenerateImage({
          prompt: `Educational illustration: ${scene.image_prompt}. Flat design, vibrant colors, clean and modern, suitable for a smart class video, no text overlays.`,
        });
        return { ...scene, image_url: imgResult.url || null };
      })
    );

    setStep(4);
    await appClient.entities.Project.update(id, {
      status: "ready",
      scenes: scenesWithImages,
      scene_count: scenesWithImages.length,
      extracted_content: content,
      prompt_style: stylePrompt || undefined,
    });

    setGenerating(false);
    queryClient.invalidateQueries({ queryKey: ["project", id] });

    // Auto-generate cinematic AI videos for every scene (the "perfect demo")
    await generateVideos(scenesWithImages);
  };

  const handleRestyle = async () => {
    if (!prompt.trim()) return;
    await generateScenes(prompt.trim());
    setPrompt("");
  };

  const generateVideos = async (scenesArg) => {
    const targetScenes = scenesArg || project?.scenes;
    if (!targetScenes || videoGen.active) return;
    setVideoGen({ active: true, current: 0, total: targetScenes.length });
    const updatedScenes = [...targetScenes];
    for (let i = 0; i < updatedScenes.length; i++) {
      setVideoGen({ active: true, current: i, total: updatedScenes.length });
      try {
        const result = await appClient.integrations.Core.GenerateVideo({
          prompt: `After Effects style motion graphics, premium educational documentary aesthetic like 3Blue1Brown meets Apple keynote. Scene concept: ${updatedScenes[i].image_prompt}. Composition: deep cinematic black background (#060608) with glowing golden-amber (#f0c040) and warm orange (#fb923c) accent lighting. Camera: slow elegant dolly push-in with subtle parallax depth, 3D layered composition, shallow depth of field with bokeh particles. Motion: abstract geometric shapes (circles, triangles, flowing lines) morphing and transforming smoothly, kinetic data visualization elements, glowing particle systems floating upward, volumetric light rays piercing through, soft lens flares, elegant curve animations drawing themselves. Lighting: high-contrast rim lighting, warm volumetric glow, dramatic shadows. Pacing: smooth, elegant, intelligent — like a high-end science documentary. Mood: sophisticated, educational, premium. CRITICAL: NO text, NO words, NO letters, NO numbers, NO subtitles, NO UI elements anywhere. Pure abstract motion graphics only. 4K cinematic quality, 24fps film look, buttery smooth motion.`,
          duration: 6,
          aspect_ratio: "16:9",
        });
        updatedScenes[i] = { ...updatedScenes[i], video_url: result.url };
        await appClient.entities.Project.update(id, { scenes: [...updatedScenes] });
        queryClient.invalidateQueries({ queryKey: ["project", id] });
      } catch (e) {
        console.error("Video generation failed for scene", i, e);
      }
    }
    setVideoGen({ active: false, current: 0, total: 0 });
    queryClient.invalidateQueries({ queryKey: ["project", id] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return null;

  const isProcessing = project.status === "extracting" || project.status === "generating" || generating;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold font-space truncate">{project.title}</h1>
            <p className="text-xs text-muted-foreground">{project.file_name}</p>
          </div>
          {project.status === "ready" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
                onClick={generateVideos}
                disabled={videoGen.active || generating}
              >
                {videoGen.active ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}
                {videoGen.active ? `${videoGen.current + 1}/${videoGen.total}` : (project.scenes?.[0]?.video_url ? "Re-render Video" : "Generate AI Video")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={() => generateScenes()}
                disabled={generating}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {isProcessing && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl animate-bounce">{GENERATION_STEPS[step]?.icon}</span>
            </div>
            <h2 className="text-2xl font-bold font-space mb-2">Creating Your Video</h2>
            <p className="text-muted-foreground mb-8">{GENERATION_STEPS[step]?.label}</p>
            {/* Steps progress */}
            <div className="max-w-sm mx-auto space-y-2">
              {GENERATION_STEPS.map((s, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-500 ${i <= step ? "opacity-100" : "opacity-30"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i < step ? "bg-green-500 text-white" : i === step ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted"}`}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className={i === step ? "font-medium" : ""}>{s.label}</span>
                  {i === step && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-auto" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {project.status === "ready" && project.scenes && (
          <>
            {videoGen.active && (
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-400 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-400">Rendering Cinematic Video</p>
                    <p className="text-sm text-muted-foreground">Scene {videoGen.current + 1} of {videoGen.total} · AI motion graphics in progress</p>
                  </div>
                  <span className="text-2xl font-black text-amber-400/30 font-mono">{Math.round(((videoGen.current) / videoGen.total) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${((videoGen.current) / videoGen.total) * 100}%` }} />
                </div>
              </div>
            )}
            <ScenePlayer scenes={project.scenes} />

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold font-space mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Customize with a Prompt
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Change the style, tone, focus, language, or depth of the video.
              </p>
              <div className="flex gap-2">
                <Textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={"e.g. Make it fun and casual, explain like I'm 10, focus on diagrams"}
                  className="min-h-[60px] rounded-xl resize-none"
                />
                <Button
                  className="rounded-xl self-end"
                  disabled={!prompt.trim() || generating}
                  onClick={handleRestyle}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold font-space mb-3">Scenes Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {project.scenes.map((scene, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl overflow-hidden relative">
                    {scene.image_url && (
                      <img src={scene.image_url} alt={scene.title} className="w-full aspect-video object-cover" />
                    )}
                    {!scene.image_url && (
                      <div className="w-full aspect-video bg-muted flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    {scene.video_url && (
                      <span className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-black text-[9px] font-black uppercase">
                        <Video className="w-2.5 h-2.5" /> Video
                      </span>
                    )}
                    <div className="p-3">
                      <p className="text-xs font-semibold truncate">{scene.icon} {scene.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {project.status === "error" && (
          <div className="text-center py-20">
            <p className="text-destructive font-medium mb-4">Something went wrong</p>
            <Button onClick={() => generateScenes()} className="rounded-xl gap-2">
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}