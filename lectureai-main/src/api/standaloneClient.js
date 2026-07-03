const isBrowser = typeof window !== 'undefined';

const PROJECT_STORAGE_KEY = 'lectureai_projects_v1';
const UPLOAD_STORAGE_KEY = 'lectureai_uploads_v1';
const USER_STORAGE_KEY = 'lectureai_user_v1';

const defaultUser = {
  id: 'local-admin',
  name: 'Local Admin',
  role: 'admin',
};

function readJson(key, fallback) {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function createId() {
  if (isBrowser && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `local_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readProjects() {
  return readJson(PROJECT_STORAGE_KEY, []);
}

function writeProjects(projects) {
  writeJson(PROJECT_STORAGE_KEY, projects);
}

function readUploads() {
  return readJson(UPLOAD_STORAGE_KEY, {});
}

function writeUploads(uploads) {
  writeJson(UPLOAD_STORAGE_KEY, uploads);
}

function readCurrentUser() {
  return readJson(USER_STORAGE_KEY, defaultUser) || defaultUser;
}

function writeCurrentUser(user) {
  writeJson(USER_STORAGE_KEY, user || defaultUser);
}

function isTextFile(file) {
  const name = file?.name?.toLowerCase() || '';
  const type = file?.type?.toLowerCase() || '';
  return (
    type.startsWith('text/') ||
    /\.(txt|md|markdown|json|csv|ts|tsx|js|jsx|html|css|xml|yml|yaml)$/i.test(name)
  );
}

function readFileAsText(file) {
  if (!file || !isTextFile(file)) return Promise.resolve('');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
    reader.readAsText(file);
  });
}

function toTitleCase(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

function stripExtension(name = 'Untitled lesson') {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

function summarizeText(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const sentences = clean.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, 2).join(' ').slice(0, 260);
}

function keywordsFromText(text, fallback) {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'have', 'will', 'into', 'about', 'they',
    'their', 'there', 'what', 'when', 'where', 'how', 'why', 'can', 'could', 'should', 'would', 'are',
    'was', 'were', 'you', 'our', 'your', 'them', 'then', 'than', 'also', 'more', 'most', 'some', 'each',
    'many', 'much', 'such', 'one', 'two', 'three', 'four', 'five', 'like', 'just', 'very', 'over', 'under',
    'through', 'after', 'before', 'because', 'does', 'did', 'done', 'its'
  ]);
  const words = (text.toLowerCase().match(/[a-z][a-z0-9-]+/g) || []).filter((word) => !stopWords.has(word));
  const freq = new Map();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }
  const terms = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([word]) => toTitleCase(word));
  if (terms.length) return terms;
  return [fallback].filter(Boolean);
}

function extractLessonSource(prompt = '') {
  const contentMatch = prompt.match(/DOCUMENT CONTENT:\s*([\s\S]*?)(?:\n\nSTYLE INSTRUCTION:|\n\nProduce 6-8 scenes)/i);
  const rawContent = contentMatch ? contentMatch[1].trim() : prompt.trim();
  try {
    const parsed = JSON.parse(rawContent);
    return parsed && typeof parsed === 'object' ? parsed : { raw: rawContent };
  } catch {
    return { raw: rawContent };
  }
}

function buildLessonTopic(source) {
  const candidates = [source?.title, source?.topics?.[0], source?.summary, source?.raw]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean);
  if (!candidates.length) return 'Learning Something New';
  const first = candidates[0];
  if (first.length <= 50) return toTitleCase(first);
  return toTitleCase(first.slice(0, 50));
}

function numericSeed(text = '') {
  return [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0) || 1;
}

function makeExample(seed) {
  const base = 8 + (seed % 5);
  const step = 2 + (seed % 4);
  const count = 3 + (seed % 3);
  const total = base + step * count;
  return { base, step, count, total };
}

function buildScenes(topic, summary, style = '') {
  const seed = numericSeed(`${topic}:${summary}:${style}`);
  const example = makeExample(seed);
  const accentWord = topic.split(' ').slice(0, 2).join(' ') || 'the idea';
  const points = keywordsFromText(`${topic} ${summary} ${style}`, topic);

  const scenes = [
    {
      title: `${accentWord} in motion`,
      visual_description: `A cinematic opening that frames ${accentWord.toLowerCase()} as a simple, memorable story.`,
      narration: `We begin with ${accentWord.toLowerCase()} and a single clear picture. This lesson starts small, then builds one idea at a time so the pattern stays easy to follow. By the end, the example will feel obvious because every step will have a number attached to it.`,
      formula: `total = ${example.base} + ${example.step} × ${example.count}`,
      derivation_steps: [
        `Start with base = ${example.base}`,
        `Add step = ${example.step}`,
        `${example.count} groups → ${example.step} × ${example.count} = ${example.step * example.count}`,
        `${example.base} + ${example.step * example.count} = ${example.total}`,
      ],
      key_points: [
        `We treat ${accentWord.toLowerCase()} as a repeatable pattern.`,
        'The numbers give the idea a concrete shape.',
        'A short worked example makes the lesson easier to remember.',
      ],
      icon: '🎬',
      image_prompt: `Abstract cinematic opener for ${topic}, dark background, glowing amber geometry, no text, no labels.`,
    },
    {
      title: 'Define the rule',
      visual_description: `A precise definition of the core rule behind ${topic.toLowerCase()}.`,
      narration: `Now we define the rule. A good definition explains what changes, what stays fixed, and what output we should expect. Once the rule is clear, the rest of the lesson becomes a sequence of controlled moves rather than a guess.`,
      formula: `rate = ${example.total} / ${example.count}`,
      derivation_steps: [
        `Use total = ${example.total}`,
        `Use groups = ${example.count}`,
        `${example.total} / ${example.count} = ${(example.total / example.count).toFixed(2)}`,
        `Round to ${(example.total / example.count).toFixed(2)} per group`,
      ],
      key_points: [
        'Definitions should tell you exactly what to measure.',
        'A formula compresses the rule into one line.',
        'Numbers make the rule testable immediately.',
      ],
      icon: '📐',
      image_prompt: `Clean educational diagram explaining the definition of ${topic}, with grids and flowing shapes, no text.`,
    },
    {
      title: 'Worked example',
      visual_description: `A step-by-step worked example that applies the rule to real values.`,
      narration: `This is the part where the idea becomes usable. We substitute actual values, keep the arithmetic simple, and show exactly how the result is produced. If you can follow this example, you can repeat the method with new numbers later.`,
      formula: `y = ${example.base} + ${example.step}x`,
      derivation_steps: [
        `Choose x = ${example.count}`,
        `${example.step} × ${example.count} = ${example.step * example.count}`,
        `${example.base} + ${example.step * example.count} = ${example.total}`,
        `So y = ${example.total}`,
      ],
      key_points: [
        'A worked example shows the procedure, not just the answer.',
        'Every substitution should be visible.',
        'The final number should match the rule exactly.',
      ],
      icon: '✍️',
      image_prompt: `Chalkboard-style worked example for ${topic}, clean geometry, glowing highlights, no text.`,
    },
    {
      title: 'Why it works',
      visual_description: `A conceptual bridge that connects the formula to the underlying intuition.`,
      narration: `The reason this works is that the same operation is repeated in a controlled way. That repetition makes the result predictable, which is exactly what we want from a formula. The intuition and the arithmetic are telling the same story from two different angles.`,
      formula: `difference = ${example.total} - ${example.base}`,
      derivation_steps: [
        `${example.total} - ${example.base} = ${example.total - example.base}`,
        `${example.total - example.base} / ${example.count} = ${((example.total - example.base) / example.count).toFixed(2)}`,
        `Each group contributes ${(example.step).toFixed(2)} units`,
        `The pattern stays stable across repeats`,
      ],
      key_points: [
        'A formula is trustworthy when the pattern stays stable.',
        'Intuition and arithmetic should agree.',
        'The same idea should work on every repeat.',
      ],
      icon: '🧠',
      image_prompt: `Conceptual teaching scene for ${topic}, layered shapes, arrows, and a luminous center, no text.`,
    },
    {
      title: 'Common mistakes',
      visual_description: `A cautionary scene that highlights easy ways to misread the method.`,
      narration: `The most common mistake is skipping the setup and jumping straight to the answer. Another mistake is mixing the values so the units no longer line up. If you keep the roles of each number clear, the method stays reliable.`,
      formula: `check = ${example.base} + ${example.step} × ${example.count}`,
      derivation_steps: [
        `Wrong order breaks the pattern`,
        `${example.step} × ${example.count} = ${example.step * example.count}`,
        `${example.base} + ${example.step * example.count} = ${example.total}`,
        `Check the total before moving on`,
      ],
      key_points: [
        'Do not mix up the order of operations.',
        'Always verify the units or roles of each value.',
        'A quick check prevents compounding errors.',
      ],
      icon: '⚠️',
      image_prompt: `Educational caution scene for ${topic}, split-screen comparison, warning accents, no text.`,
    },
    {
      title: 'Takeaway',
      visual_description: `A closing summary that ties the intuition, formula, and example together.`,
      narration: `Here is the takeaway: a clear idea, a clean formula, and one worked example are enough to make the lesson stick. The number line and the story should end in the same place. Once that happens, the concept becomes something you can use on your own.`,
      formula: `answer = ${example.total}`,
      derivation_steps: [
        `Start with ${example.base}`,
        `Apply ${example.step} for ${example.count} repeats`,
        `${example.step} × ${example.count} = ${example.step * example.count}`,
        `${example.base} + ${example.step * example.count} = ${example.total}`,
      ],
      key_points: [
        'Clear structure makes the lesson reusable.',
        'Worked numbers prove the rule in action.',
        'The final answer should feel earned, not guessed.',
      ],
      icon: '✅',
      image_prompt: `Closing cinematic lesson frame for ${topic}, glowing finale shapes, no text, premium educational look.`,
    },
  ];

  return scenes.map((scene, index) => ({
    ...scene,
    title: index === 0 ? `${scene.title}` : scene.title,
    key_points: scene.key_points.slice(0, 3),
    derivation_steps: scene.derivation_steps.slice(0, 4),
    image_prompt: `${scene.image_prompt} Seed ${seed}.`,
  }));
}

function sceneSvg({ title, subtitle, accent = '#f0c040', secondary = '#fb923c', animated = false }) {
  const safeTitle = String(title || 'LectureAI').replace(/[<>&]/g, '');
  const safeSubtitle = String(subtitle || '').replace(/[<>&]/g, '');
  const motion = animated ? `
    <style>
      .orbit { animation: spin 14s linear infinite; transform-origin: 50% 50%; }
      .drift { animation: drift 6s ease-in-out infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes drift { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
    </style>` : '';

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" role="img" aria-label="LectureAI placeholder visual">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#050507" />
          <stop offset="100%" stop-color="#10101a" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.45" />
          <stop offset="100%" stop-color="${secondary}" stop-opacity="0" />
        </radialGradient>
      </defs>
      ${motion}
      <rect width="1280" height="720" fill="url(#bg)" />
      <rect width="1280" height="720" fill="url(#glow)" />
      <g class="orbit" opacity="0.7">
        <circle cx="960" cy="180" r="140" fill="none" stroke="${accent}" stroke-opacity="0.45" stroke-width="6" />
        <circle cx="960" cy="180" r="100" fill="none" stroke="${secondary}" stroke-opacity="0.35" stroke-width="3" />
      </g>
      <g class="drift">
        <rect x="120" y="140" width="420" height="260" rx="36" fill="#0f0f15" stroke="${accent}" stroke-opacity="0.35" stroke-width="4" />
        <rect x="170" y="190" width="320" height="24" rx="12" fill="${accent}" fill-opacity="0.85" />
        <rect x="170" y="232" width="220" height="16" rx="8" fill="#ffffff" fill-opacity="0.22" />
        <rect x="170" y="264" width="280" height="16" rx="8" fill="#ffffff" fill-opacity="0.12" />
      </g>
      <circle cx="250" cy="500" r="92" fill="${secondary}" fill-opacity="0.18" />
      <circle cx="1090" cy="560" r="58" fill="${accent}" fill-opacity="0.2" />
      <text x="120" y="560" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="800" fill="#fff">${safeTitle}</text>
      <text x="120" y="614" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#d1d5db">${safeSubtitle}</text>
    </svg>
  `)}`;
}

function makeSceneAsset(prompt, animated = false) {
  const seed = numericSeed(prompt);
  const hue = 40 + (seed % 18);
  const accent = `hsl(${hue} 95% 65%)`;
  const secondary = `hsl(${(hue + 20) % 360} 95% 58%)`;
  const title = prompt.split(/[.!?]/)[0].slice(0, 40) || 'LectureAI';
  return sceneSvg({
    title,
    subtitle: animated ? 'Cinematic motion layer' : 'Educational illustration',
    accent,
    secondary,
    animated,
  });
}

function ensureSeedData() {
  if (!isBrowser) return;
  const projects = readProjects();
  if (projects.length > 0) return;

  const sampleScenes = buildScenes(
    'Sample lesson on exponential growth',
    'A standalone demo lesson that ships with the app so the archive is never empty.',
    'clear and cinematic'
  ).map((scene) => ({
    ...scene,
    image_url: makeSceneAsset(scene.image_prompt, false),
    video_url: makeSceneAsset(scene.image_prompt, true),
  }));

  writeProjects([
    {
      id: 'sample-lesson',
      title: 'Sample Lesson',
      status: 'ready',
      file_url: 'standalone://sample-lesson',
      file_name: 'sample-notes.txt',
      extracted_content: 'Standalone demo content bundled with the app.',
      prompt_style: 'clear and cinematic',
      scenes: sampleScenes,
      scene_count: sampleScenes.length,
      created_date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updated_date: new Date().toISOString(),
    },
  ]);
}

function sortProjects(projects, sortExpr) {
  if (!sortExpr) return projects;
  const direction = sortExpr.startsWith('-') ? -1 : 1;
  const field = sortExpr.replace(/^-/, '');
  return [...projects].sort((left, right) => {
    const leftValue = left?.[field] || '';
    const rightValue = right?.[field] || '';
    if (leftValue === rightValue) return 0;
    return leftValue > rightValue ? direction : -direction;
  });
}

function normalizeProject(project) {
  return {
    ...project,
    created_date: project.created_date || new Date().toISOString(),
    updated_date: project.updated_date || project.created_date || new Date().toISOString(),
    scene_count: project.scene_count ?? project.scenes?.length ?? 0,
  };
}

function persistProject(project) {
  const projects = readProjects();
  const normalized = normalizeProject(project);
  const index = projects.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    projects[index] = normalized;
  } else {
    projects.unshift(normalized);
  }
  writeProjects(projects);
  return normalized;
}

function lookupProject(id) {
  return readProjects().find((project) => project.id === id) || null;
}

function lookupUpload(fileUrl) {
  const uploads = readUploads();
  return uploads[fileUrl] || null;
}

function inferTopicFromUpload(upload) {
  const name = stripExtension(upload?.name || 'Untitled lesson');
  const sourceText = upload?.text?.trim() || '';
  if (!sourceText) return toTitleCase(name) || 'Untitled Lesson';
  const firstLine = sourceText.split(/\n+/).find(Boolean) || sourceText;
  return toTitleCase(firstLine.slice(0, 60).replace(/[^a-z0-9\s-]/gi, '')) || toTitleCase(name);
}

function createClient() {
  ensureSeedData();

  return {
    auth: {
      async me() {
        return clone(readCurrentUser());
      },
      logout(redirectUrl) {
        writeCurrentUser(defaultUser);
        if (isBrowser && redirectUrl) {
          window.location.href = redirectUrl;
        }
      },
      redirectToLogin(redirectUrl) {
        if (isBrowser) {
          window.location.href = redirectUrl || '/';
        }
      },
    },
    entities: {
      Project: {
        async list(sortExpr = '-created_date', limit = 100) {
          const projects = sortProjects(readProjects().map(normalizeProject), sortExpr).slice(0, limit);
          return clone(projects);
        },
        async get(id) {
          const project = lookupProject(id);
          return project ? clone(normalizeProject(project)) : null;
        },
        async create(data) {
          const now = new Date().toISOString();
          const project = persistProject({
            id: createId(),
            created_date: now,
            updated_date: now,
            scene_count: data?.scenes?.length || data?.scene_count || 0,
            status: 'uploading',
            ...data,
          });
          return clone(project);
        },
        async update(id, patch) {
          const projects = readProjects();
          const index = projects.findIndex((project) => project.id === id);
          if (index < 0) return null;
          const updated = normalizeProject({
            ...projects[index],
            ...patch,
            updated_date: new Date().toISOString(),
          });
          projects[index] = updated;
          writeProjects(projects);
          return clone(updated);
        },
      },
    },
    integrations: {
      Core: {
        async UploadFile({ file }) {
          if (!file) {
            throw new Error('A file is required.');
          }

          const fileUrl = `standalone://upload/${createId()}`;
          const text = await readFileAsText(file);
          const uploads = readUploads();
          uploads[fileUrl] = {
            id: fileUrl,
            name: file.name,
            type: file.type || '',
            size: file.size || 0,
            text,
            created_date: new Date().toISOString(),
          };
          writeUploads(uploads);

          return {
            file_url: fileUrl,
            file_name: file.name,
            text,
            type: file.type || '',
          };
        },
        async ExtractDataFromUploadedFile({ file_url }) {
          const upload = lookupUpload(file_url);
          const topic = inferTopicFromUpload(upload);
          const summary = upload?.text?.trim()
            ? summarizeText(upload.text)
            : `A standalone demo lesson about ${topic.toLowerCase()}.`;
          const topics = keywordsFromText(`${topic} ${upload?.text || ''}`, topic).slice(0, 3);

          return {
            status: 'success',
            output: {
              title: topic,
              topics,
              summary,
            },
          };
        },
        async InvokeLLM({ prompt }) {
          const source = extractLessonSource(prompt);
          const topic = buildLessonTopic(source);
          const style = /STYLE INSTRUCTION:\s*([\s\S]*?)(?:\n\nProduce 6-8 scenes|$)/i.exec(prompt)?.[1]?.trim() || '';
          const scenes = buildScenes(topic, source?.summary || source?.raw || '', style);
          return { scenes };
        },
        async GenerateImage({ prompt }) {
          return { url: makeSceneAsset(prompt, false) };
        },
        async GenerateVideo({ prompt }) {
          return { url: makeSceneAsset(prompt, true) };
        },
      },
    },
  };
}

export const appClient = createClient();
