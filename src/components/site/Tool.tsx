import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import JSZip from "jszip";
import fileSaver from "file-saver";
const { saveAs } = fileSaver;
import { toast } from "sonner";
import {
  UploadCloud, Image as ImageIcon, Download, Loader2, Trash2, Play,
  Layers, Scissors, Square, CheckCircle2, Clock, AlertCircle, Wand2, RotateCcw,
} from "lucide-react";
import { processImage, formatBytes, type OutputMode } from "@/lib/bg-remove";

type Status = "pending" | "processing" | "done" | "error";

interface Item {
  id: string;
  file: File;
  previewUrl: string;
  resultUrl?: string;
  originalResultUrl?: string;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [featherValue, setFeatherValue] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Reset edge refinement state when selection changes
  useEffect(() => {
    setFeatherValue(0);
    setPreviewUrl(null);
  }, [selectedId]);

  // Debounced live preview of feathering
  useEffect(() => {
    if (!selected?.originalResultUrl) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (featherValue === 0) {
      setPreviewUrl(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const blob = await featherEdges(selected.originalResultUrl!, featherValue);
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        console.error(err);
      }
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [featherValue, selected?.originalResultUrl]);

  async function runOne(item: Item) {
    setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "processing" } : p)));
    try {
      const blob = await processImage(item.file, { mode });
      const url = URL.createObjectURL(blob);
      setItems((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "done", resultUrl: url, originalResultUrl: url } : p,
        ),
      );
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
    a.download = item.file.name.replace(/\.[^.]+$/, "") + "-snipbgtool.png";
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
      zip.file(it.file.name.replace(/\.[^.]+$/, "") + "-snipbgtool.png", blob);
    }
    const out = await zip.generateAsync({ type: "blob" });
    saveAs(out, "snipbgtool-results.zip");
    toast.success("ZIP download started");
  }

  async function applyRefinement() {
    if (!selected?.originalResultUrl) return;
    setRefining(true);
    try {
      const blob =
        featherValue === 0
          ? await (await fetch(selected.originalResultUrl)).blob()
          : await featherEdges(selected.originalResultUrl, featherValue);
      const url = URL.createObjectURL(blob);
      setItems((prev) =>
        prev.map((p) => (p.id === selected.id ? { ...p, resultUrl: url } : p)),
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      toast.success("Edge refinement applied");
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply refinement");
    } finally {
      setRefining(false);
    }
  }

  function resetRefinement() {
    if (!selected?.originalResultUrl) return;
    setFeatherValue(0);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setItems((prev) =>
      prev.map((p) =>
        p.id === selected.id ? { ...p, resultUrl: p.originalResultUrl } : p,
      ),
    );
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
            <div className="mt-10">
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
                  <Play className="w-4 h-4" /> Generate
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
                          <ReactCompareSliderImage src={previewUrl ?? selected.resultUrl} alt="Result" />
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

                {/* Edge Refinement */}
                {selected.status === "done" && selected.originalResultUrl && (
                  <div
                    className="mt-6 rounded-xl bg-white p-6"
                    style={{
                      border: "1px solid #C8D9E6",
                      boxShadow: "0 4px 20px rgba(47, 65, 86, 0.08)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-brand-dark" />
                      <h4 className="font-bold text-brand-dark text-lg">Edge Refinement</h4>
                    </div>
                    <p className="text-sm text-brand-teal mt-1">
                      Drag the slider to soften harsh edges and remove leftover background fringe.
                    </p>

                    <div className="mt-5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-brand-dark">Soften Edges</label>
                        <span className="inline-flex items-center justify-center min-w-12 px-2.5 py-1 rounded-full bg-brand-light text-brand-dark text-xs font-semibold">
                          {featherValue}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        step={1}
                        value={featherValue}
                        onChange={(e) => setFeatherValue(Number(e.target.value))}
                        className="feather-slider mt-3 w-full"
                      />
                      <div className="flex justify-between text-xs text-brand-dark/60 mt-1">
                        <span>None</span>
                        <span>Max</span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={applyRefinement}
                        disabled={refining}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-dark text-white px-5 py-3 font-semibold hover:brightness-110 transition disabled:opacity-60 min-h-[44px]"
                      >
                        {refining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        Apply Refinement
                      </button>
                      <button
                        onClick={resetRefinement}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-brand-teal border-2 border-brand-teal px-5 py-3 font-semibold hover:bg-brand-light/40 transition min-h-[44px]"
                      >
                        <RotateCcw className="w-4 h-4" /> Reset
                      </button>
                    </div>
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

async function featherEdges(src: string, radius: number): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  // Original RGBA
  const origCanvas = document.createElement("canvas");
  origCanvas.width = w;
  origCanvas.height = h;
  const origCtx = origCanvas.getContext("2d")!;
  origCtx.drawImage(img, 0, 0);
  const origData = origCtx.getImageData(0, 0, w, h);

  // Blurred copy
  const blurCanvas = document.createElement("canvas");
  blurCanvas.width = w;
  blurCanvas.height = h;
  const blurCtx = blurCanvas.getContext("2d")!;
  blurCtx.filter = `blur(${radius}px)`;
  blurCtx.drawImage(img, 0, 0);
  const blurData = blurCtx.getImageData(0, 0, w, h);

  // Compose: keep original RGB, use blurred alpha
  const out = origCtx.createImageData(w, h);
  for (let i = 0; i < origData.data.length; i += 4) {
    out.data[i] = origData.data[i];
    out.data[i + 1] = origData.data[i + 1];
    out.data[i + 2] = origData.data[i + 2];
    out.data[i + 3] = blurData.data[i + 3];
  }
  origCtx.putImageData(out, 0, 0);

  return await new Promise<Blob>((resolve, reject) =>
    origCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
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