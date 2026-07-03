import { Link } from "react-router-dom";
import { FileText, Clock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import moment from "moment";

const STATUS_MAP = {
  uploading: { icon: Loader2, label: "Uploading", color: "text-muted-foreground", spin: true },
  extracting: { icon: Loader2, label: "Extracting", color: "text-primary", spin: true },
  generating: { icon: Loader2, label: "Generating", color: "text-accent", spin: true },
  ready: { icon: CheckCircle, label: "Ready", color: "text-green-500", spin: false },
  error: { icon: AlertCircle, label: "Error", color: "text-destructive", spin: false },
};

export default function ProjectCard({ project }) {
  const s = STATUS_MAP[project.status] || STATUS_MAP.uploading;
  const Icon = s.icon;

  return (
    <Link
      to={`/project/${project.id}`}
      className="group block bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${s.color}`}>
          <Icon className={`w-3.5 h-3.5 ${s.spin ? "animate-spin" : ""}`} />
          {s.label}
        </div>
      </div>
      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
        {project.title}
      </h3>
      <p className="text-xs text-muted-foreground mt-1">
        {project.scene_count ? `${project.scene_count} scenes` : project.file_name || "Processing..."}
      </p>
      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        {moment(project.created_date).fromNow()}
      </div>
    </Link>
  );
}