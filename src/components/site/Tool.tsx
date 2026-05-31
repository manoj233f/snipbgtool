import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import JSZip from "jszip";
import fileSaver from "file-saver";
const { saveAs } = fileSaver;
import { toast } from "sonner";
import {
  UploadCloud, Image as ImageIcon, Download, Loader2, Trash2, Play,
  Layers, Scissors, Square, CheckCircle2, Clock, AlertCircle, X,
} from "lucide-react";
import { processImage, formatBytes, type OutputMode } from "@/lib/bg-remove";

type Status = "pending" | "processing" | "done" | "error";

interface Item {
  id: string;
  file: File;
  previewUrl: string;
  resultUrl?: string;
  status: Status;
  error?: string;
}

const modeOptions: { id: OutputMode; label: string; desc: string; Icon: typeof Layers }[] = [
  { id: "transparent", label: "Transparent PNG", desc: "Subject on full transparency", Icon: Layers },
  { id: "cutout", label: "Cutout", desc: "Crisp subject isolation", Icon: Scissors },
  { id: "isolated", label: "Isolated", desc: "Subject on a clean background", Icon: Square },
];

export function Tool() {
  const [items, setItems] = useState<Item[]>([]);
  const [mode, setMode] = useState<OutputMode>("transparent");
  const [useCustomBg, setUseCustomBg] = useState(false);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted.length) return;
    const next: Item[] = accepted.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: "pending",
    }));
    setItems((prev) => [...prev, ...next]);
    setSelectedId((prev) => prev ?? next[0].id);
    toast.success(`${accepted.length} image${accepted.length > 1 ? "s" : ""} added`);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  const selected = useMemo(() => items.find((i) => i.id === selectedId) ?? items[0], [items, selectedId]);

  async function runOne(item: Item) {
    setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "processing" } : p)));
    try {
      const blob = await processImage(item.file, {
        mode,
        backgroundColor: useCustomBg ? bgColor : null,
        backgroundImage: useCustomBg && bgImage ? bgImage : null,
      });
      const url = URL.createObjectURL(blob);
      setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "done", resultUrl: url } : p)));
    } catch (err) {
      console.error(err);
      setItems((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "error", error: (err as Error).message } : p,
        ),
      );
      toast.error(`Failed to process ${item.file.name}`);
    }
  }

  async function processAll() {
    const pending = items.filter((i) => i.status === "pending" || i.status === "error");
    if (!pending.length) {
      toast.info("Nothing left to process");
      return;
    }
    toast.message(`Processing ${pending.length} image${pending.length > 1 ? "s" : ""}…`);
    for (const it of pending) {
      await runOne(it);
    }
    toast.success("All done!");
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  function downloadOne(item: Item) {
    if (!item.resultUrl) return;
    const a = document.createElement("a");
    a.href = item.resultUrl;
    a.download = item.file.name.replace(/\.[^.]+$/, "") + "-crispr.png";
    a.click();
    toast.success("Download started");
  }

  async function downloadAll() {
    const done = items.filter((i) => i.status === "done" && i.resultUrl);
    if (!done.length) return;
    const zip = new JSZip();
    for (const it of done) {
      const res = await fetch(it.resultUrl!);
      const blob = await res.blob();
      zip.file(it.file.name.replace(/\.[^.]+$/, "") + "-crispr.png", blob);
    }
    const out = await zip.generateAsync({ type: "blob" });
    saveAs(out, "crispr-results.zip");
    toast.success("ZIP download started");
  }

  function handleBgImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setBgImage(reader.result as string);
    reader.readAsDataURL(f);
  }

  return (
    <section id="tool" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-brand-teal uppercase tracking-wider">The tool</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-brand-dark tracking-tight">
            Drop. Process. Done.
          </h2>
          <p className="mt-4 text-brand-dark/70">
            Everything runs in your browser. Your images never leave your device.
          </p>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 p-10 md:p-16 text-center cursor-default ${
            isDragActive
              ? "border-brand-teal bg-brand-light/40"
              : "border-brand-teal/60 bg-brand-cream/60 hover:bg-brand-light/30"
          }`}
        >
          <input {...getInputProps()} />
          <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-teal text-white grid place-items-center shadow-card">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="mt-5 text-2xl font-bold text-brand-dark">
            {isDragActive ? "Drop to upload" : "Drag & drop your images here"}
          </h3>
          <p className="mt-2 text-brand-dark/70">JPG, PNG, or WEBP — multiple files supported</p>
          <button
            type="button"
            onClick={open}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-dark text-white px-6 py-3 font-medium hover:brightness-110 transition shadow-card"
          >
            <ImageIcon className="w-4 h-4" /> Browse Files
          </button>
        </div>

        {items.length > 0 && (
          <>
            {/* Options */}
            <div className="mt-10 grid lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <h4 className="font-bold text-brand-dark text-lg">Output mode</h4>
                <p className="text-sm text-brand-dark/60 mt-1">Choose how the result should look.</p>
                <div className="mt-5 grid sm:grid-cols-3 gap-3">
                  {modeOptions.map((m) => {
                    const active = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                          active
                            ? "border-brand-teal bg-brand-light/40 shadow-card"
                            : "border-brand-light/70 bg-white hover:border-brand-teal/50"
                        }`}
                      >
                        <m.Icon className={`w-5 h-5 ${active ? "text-brand-teal" : "text-brand-dark/60"}`} />
                        <div className="mt-2 font-semibold text-brand-dark text-sm">{m.label}</div>
                        <div className="text-xs text-brand-dark/60 mt-0.5">{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-brand-dark text-lg">Custom background</h4>
                    <p className="text-sm text-brand-dark/60 mt-1">Optional — replace the background.</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomBg}
                      onChange={(e) => setUseCustomBg(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-brand-light rounded-full peer peer-checked:bg-brand-teal relative transition">
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition peer-checked:translate-x-5" />
                    </div>
                  </label>
                </div>
                {useCustomBg && (
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-brand-dark w-28">Solid color</label>
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => {
                          setBgColor(e.target.value);
                          setBgImage(null);
                        }}
                        className="w-12 h-10 rounded-lg border border-brand-light cursor-pointer"
                      />
                      <span className="text-sm font-mono text-brand-dark/70">{bgColor}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-brand-dark w-28">Or image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBgImageUpload}
                        className="text-sm text-brand-dark/70 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-light file:text-brand-dark file:font-medium hover:file:bg-brand-teal/20 file:cursor-pointer"
                      />
                      {bgImage && (
                        <button onClick={() => setBgImage(null)} className="text-brand-dark/50 hover:text-brand-dark">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {bgImage && (
                      <img src={bgImage} alt="bg preview" className="h-20 rounded-lg object-cover border border-brand-light" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action bar */}
            <div className="mt-8 flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm text-brand-dark/70">
                <span className="font-semibold text-brand-dark">{items.length}</span> image{items.length > 1 ? "s" : ""} ·{" "}
                {items.filter((i) => i.status === "done").length} done
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={processAll}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-teal text-white px-5 py-3 font-semibold hover:brightness-110 transition shadow-card disabled:opacity-50"
                  disabled={items.every((i) => i.status === "done" || i.status === "processing")}
                >
                  <Play className="w-4 h-4" /> Process All
                </button>
                <button
                  onClick={downloadAll}
                  disabled={!items.some((i) => i.status === "done")}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-dark text-white px-5 py-3 font-semibold hover:brightness-110 transition shadow-card disabled:opacity-40"
                >
                  <Download className="w-4 h-4" /> Download All (ZIP)
                </button>
              </div>
            </div>

            {/* Preview */}
            {selected && (
              <div className="mt-8 rounded-2xl bg-brand-cream p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-brand-dark/70">
                    Previewing: <span className="font-semibold text-brand-dark">{selected.file.name}</span>
                  </div>
                  {selected.status === "done" && (
                    <button
                      onClick={() => downloadOne(selected)}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-dark text-white px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition"
                    >
                      <Download className="w-4 h-4" /> Download PNG
                    </button>
                  )}
                </div>
                <div className="rounded-xl overflow-hidden border border-brand-light/70 bg-white">
                  {selected.resultUrl ? (
                    <ReactCompareSlider
                      itemOne={<ReactCompareSliderImage src={selected.previewUrl} alt="Original" />}
                      itemTwo={
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundImage:
                              "linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)",
                            backgroundSize: "20px 20px",
                            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                          }}
                        >
                          <ReactCompareSliderImage src={selected.resultUrl} alt="Result" />
                        </div>
                      }
                      style={{ height: 520 }}
                      handle={
                        <div className="h-full w-1 bg-brand-teal relative">
                          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-10 h-10 rounded-full bg-brand-teal grid place-items-center text-white shadow-lg">
                            ⇆
                          </div>
                        </div>
                      }
                    />
                  ) : (
                    <div className="relative">
                      <img src={selected.previewUrl} alt={selected.file.name} className="w-full max-h-[520px] object-contain bg-white" />
                      {selected.status === "processing" && (
                        <div className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-sm">
                          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-card text-brand-dark font-medium">
                            <Loader2 className="w-5 h-5 animate-spin text-brand-teal" /> Removing background…
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {selected.resultUrl && (
                  <div className="mt-3 flex justify-between text-xs text-brand-dark/60">
                    <span>← Original</span>
                    <span>Result →</span>
                  </div>
                )}
              </div>
            )}

            {/* Grid */}
            <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  selected={selected?.id === it.id}
                  onSelect={() => setSelectedId(it.id)}
                  onRun={() => runOne(it)}
                  onRemove={() => removeItem(it.id)}
                  onDownload={() => downloadOne(it)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function ItemCard({
  item, selected, onSelect, onRun, onRemove, onDownload,
}: {
  item: Item; selected: boolean; onSelect: () => void; onRun: () => void; onRemove: () => void; onDownload: () => void;
}) {
  const badge = {
    pending: { label: "Pending", Icon: Clock, cls: "bg-brand-light text-brand-dark" },
    processing: { label: "Processing", Icon: Loader2, cls: "bg-brand-teal text-white" },
    done: { label: "Done", Icon: CheckCircle2, cls: "bg-emerald-500 text-white" },
    error: { label: "Error", Icon: AlertCircle, cls: "bg-red-500 text-white" },
  }[item.status];
  const B = badge.Icon;
  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer rounded-2xl bg-white overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200 border-2 ${
        selected ? "border-brand-teal" : "border-transparent"
      }`}
    >
      <div className="relative aspect-square bg-brand-cream">
        <img src={item.resultUrl ?? item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
        <span className={`absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-1 ${badge.cls}`}>
          <B className={`w-3 h-3 ${item.status === "processing" ? "animate-spin" : ""}`} /> {badge.label}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-brand-dark grid place-items-center opacity-0 group-hover:opacity-100 transition hover:bg-white"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium text-brand-dark truncate">{item.file.name}</div>
        <div className="text-xs text-brand-dark/60 mt-0.5">{formatBytes(item.file.size)}</div>
        <div className="mt-3 flex gap-2">
          {item.status === "done" ? (
            <button
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-dark text-white text-xs font-semibold py-2 hover:brightness-110 transition"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onRun(); }}
              disabled={item.status === "processing"}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-teal text-white text-xs font-semibold py-2 hover:brightness-110 transition disabled:opacity-60"
            >
              {item.status === "processing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {item.status === "processing" ? "Working" : "Process"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}