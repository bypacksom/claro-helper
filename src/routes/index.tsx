import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ClipboardCopy,
  Download,
  Eraser,
  FileText,
  History,
  MessageCircle,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  User,
  ExternalLink,
  Palette,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  CASE_LABEL,
  EXAMPLE_TICKET,
  parseTicket,
  type CaseType,
  type Franja,
  type ParsedTicket,
} from "@/lib/ticket-parser";
import {
  ADP_OPTIONS,
  FRANJAS_INFO,
  SGA_TEMPLATES,
  TEMPLATE_CATEGORIES,
  WSP_TEMPLATES,
  adpSignature,
  renderTemplate,
  renderWsp,
  type SgaTemplate,
  type TemplateCategory,
  type WspTemplate,
} from "@/lib/templates";
import { exportCsv, filterHistory, localDateKey, personalMetrics, loadHistory, saveHistory, type HistoryEntry } from "@/lib/history";
import { SeasonalWidget } from "@/components/seasonal-widget";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Asistente Help Desk Claro · Instalaciones" },
      {
        name: "description",
        content:
          "Panel local para acelerar la atención de tickets de instalación de internet recibidos por WhatsApp. Extrae datos, clasifica el caso y genera respuesta lista para copiar.",
      },
      { property: "og:title", content: "Asistente Help Desk Claro · Instalaciones" },
      { property: "og:description", content: "Panel local de atención de instalaciones Claro con plantillas SGA y respuestas de WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const CASE_DOT: Record<CaseType, string> = {
  INCUMPLIMIENTO: "bg-warn",
  ADELANTAR_VISITA: "bg-critical",
  MANTENER_FRANJA: "bg-success",
  COORDINACION: "bg-info",
  RESCATE_COMERCIAL: "bg-rescue",
  GENERAL: "bg-muted-foreground",
};

const ADP_KEY = "helpdesk_claro_adp_v1";

function emptyTicket(): ParsedTicket {
  return {
    sot: "",
    sotCandidates: [],
    cliente: "",
    dni: "",
    telefono: "",
    departamento: "",
    distrito: "",
    fechaInstalacion: "",
    franja: "",
    contrata: "",
    dac: "",
    observacion: "",
    codCliente: "",
    subtipo: "",
    servicio: "",
    direccion: "",
    plano: "",
    caso: "GENERAL",
    accionSugerida: "",
  };
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  } catch {
    toast.error("No se pudo copiar");
  }
}

function diaFranja(t: ParsedTicket): string {
  // Si existe fecha, intenta dd/mm + franja. Si no, devuelve franja sola.
  const fechaCorta = (() => {
    const m = (t.fechaInstalacion || "").match(/(\d{1,2})[\/\-](\d{1,2})/);
    return m ? `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}` : "";
  })();
  return [fechaCorta, t.franja].filter(Boolean).join(" ");
}

function tplVars(t: ParsedTicket, adp: string, submotivo: string) {
  return {
    SOT: t.sot,
    DIA_FRANJA: diaFranja(t),
    CLIENTE: t.cliente,
    NUMERO: t.telefono,
    CONTRATA: t.contrata,
    ADP: adp,
    SUBMOTIVO: submotivo,
    SUBTIPO: t.subtipo,
    DIRECCION: t.direccion,
    DISTRITO: t.distrito,
    SERVICIO: t.servicio,
    PLANO: t.plano,
    COD_CLIENTE: t.codCliente,
  };
}

type Theme = "light" | "dark" | "halloween" | "navidad";
const THEME_KEY = "helpdesk_claro_theme_v1";

const QUICK_LINKS = [
  { label: "148", url: "https://claro360.com/plataforma360/Peru/soporte_remoto" },
  { label: "TOA", url: "https://amx-peru.fs.ocs.oraclecloud.com/" },
  { label: "INCOGNITO", url: "http://172.17.51.6/sac/Login_input" },
  { label: "AICC", url: "https://10.189.8.188:28090/service-cloud/aicc-web/index/index.html#/ManualAppointWorkbenchDetails?taskId=1061244585&orgId=1752727161880235604&appointId=175435461525835224677465120200&eventType=AgentEvent_Customer_Release&updateCallId=1754354624-11840&isFirst=true&AgentEvent_Call_Out_Fail=true" },
  { label: "GEODIR", url: "https://maps.geodir.co/bravo-maps" },
];

function applyTheme(t: Theme) {
  const el = document.documentElement;
  el.classList.toggle("dark", t !== "light");
  el.classList.toggle("halloween", t === "halloween");
  el.classList.toggle("navidad", t === "navidad");
}

export function Dashboard() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved === "dark" || saved === "halloween" || saved === "light" || saved === "navidad") setTheme(saved);
  }, []);
  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // ADP activo
  const [adp, setAdp] = useState<string>("Jhostin Baldeon");
  const [adpAskOpen, setAdpAskOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(ADP_KEY);
    if (saved) {
      setAdp(saved);
    } else {
      setAdpAskOpen(true);
    }
  }, []);

  const confirmAdp = (name: string) => {
    setAdp(name);
    if (typeof window !== "undefined") window.localStorage.setItem(ADP_KEY, name);
    setAdpAskOpen(false);
    toast.success(`ADP activo: ${name}`);
  };

  // Ticket
  const [raw, setRaw] = useState("");
  const [ticket, setTicket] = useState<ParsedTicket>(emptyTicket());
  const [analyzed, setAnalyzed] = useState(false);

  // Estado de SOT / plantilla seleccionada
  const [tplCategory, setTplCategory] = useState<TemplateCategory>(
    "Confirmación",
  );
  const [tplId, setTplId] = useState<string>(SGA_TEMPLATES[0].id);
  const [submotivo, setSubmotivo] = useState<string>("");
  const [respuesta, setRespuesta] = useState("");
  const [respManual, setRespManual] = useState(false);

  // WhatsApp panel
  const [wspId, setWspId] = useState<string>(WSP_TEMPLATES[0].id);
  const [wspExtra, setWspExtra] = useState<string>("");
  const [wsp, setWsp] = useState<string>("");
  const [wspManual, setWspManual] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [query, setQuery] = useState("");
  const [filtroCaso, setFiltroCaso] = useState<string>("ALL");
  const [today, setToday] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroAdp, setFiltroAdp] = useState("SELF");
  const [filtroEstado, setFiltroEstado] = useState("ALL");
  useEffect(() => {
    const update = () => {
      const day = localDateKey();
      setToday(previous => {
        if (previous !== day) setFiltroFecha(current => !current || current === previous ? day : current);
        return day;
      });
    };
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const currentTpl: SgaTemplate =
    SGA_TEMPLATES.find((t) => t.id === tplId) ?? SGA_TEMPLATES[0];

  const templatesInCategory = useMemo(
    () => SGA_TEMPLATES.filter((t) => t.category === tplCategory),
    [tplCategory],
  );

  // Si cambia la categoría, selecciona la primera plantilla de esa categoría
  useEffect(() => {
    if (!templatesInCategory.find((t) => t.id === tplId)) {
      setTplId(templatesInCategory[0]?.id ?? "");
      setSubmotivo("");
    }
  }, [tplCategory, templatesInCategory, tplId]);

  // Regenerar respuesta cuando cambian plantilla / ticket / submotivo / adp
  useEffect(() => {
    if (respManual) return;
    if (!currentTpl) return;
    setRespuesta(
      renderTemplate(currentTpl, tplVars(ticket, adp, submotivo)),
    );
  }, [currentTpl, ticket, submotivo, adp, respManual]);

  // WhatsApp render
  const currentWsp: WspTemplate =
    WSP_TEMPLATES.find((w) => w.id === wspId) ?? WSP_TEMPLATES[0];
  useEffect(() => {
    if (wspManual) return;
    setWsp(renderWsp(currentWsp, { SOT: ticket.sot, SUBMOTIVO: wspExtra, FIRMA: adpSignature(adp) }));
  }, [currentWsp, ticket.sot, wspExtra, wspManual, adp]);

  const handleAnalyze = () => {
    if (!raw.trim()) {
      toast.error("Pega un ticket primero");
      return;
    }
    const p = parseTicket(raw);
    setTicket(p);
    setAnalyzed(true);
    setRespManual(false);
    setWspManual(false);
    if (!p.sot) toast.warning("No se detectó SOT. Ingrésala manualmente.");
    else toast.success(`Caso detectado: ${CASE_LABEL[p.caso]}`);
  };

  const handleClearTicket = () => {
    setRaw("");
    setTicket(emptyTicket());
    setAnalyzed(false);
    setSubmotivo("");
    setRespuesta("");
    setRespManual(false);
    setWsp("");
    setWspManual(false);
    setWspExtra("");
  };

  const handleExample = () => {
    setRaw(EXAMPLE_TICKET);
    toast.message("Ticket de ejemplo cargado");
  };

  const handleClearAll = () => {
    if (!confirm("¿Borrar ticket actual e historial local?")) return;
    handleClearTicket();
    saveHistory([]);
    setHistory([]);
    toast.success("Datos locales eliminados");
  };

  const handleSaveHistory = () => {
    if (!analyzed) {
      toast.error("Analiza un ticket primero");
      return;
    }
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      sot: ticket.sot || "S/N",
      caso: ticket.caso,
      estado: `${currentTpl.label}${submotivo ? ` · ${submotivo}` : ""}`,
      respuesta,
      cliente: ticket.cliente,
      adp,
      templateId: currentTpl.id,
    };
    const next = [entry, ...history];
    setHistory(next);
    saveHistory(next);
    toast.success("Guardado en historial");
  };

  const handleDeleteHistory = (id: string) => {
    const next = history.filter((h) => h.id !== id);
    setHistory(next);
    saveHistory(next);
  };

  const metrics = useMemo(() => personalMetrics(history, adp, today), [history, adp, today]);
  const filteredHistory = useMemo(() => filterHistory(history, {
    date: filtroFecha, adp: filtroAdp === "SELF" ? adp : filtroAdp,
    query, caso: filtroCaso, estado: filtroEstado,
  }), [history, filtroFecha, filtroAdp, adp, query, filtroCaso, filtroEstado]);
  const historyAdps = [...new Set(history.map(h => h.adp).filter((name): name is string => Boolean(name)))];
  const historyStates = [...new Set(history.map(h => h.estado).filter(Boolean))];
  const resetFilters = () => {
    setFiltroFecha(today); setFiltroAdp("SELF"); setFiltroCaso("ALL"); setFiltroEstado("ALL"); setQuery("");
  };
  const handleExport = () => {
    if (!filteredHistory.length) { toast.error("Sin registros para estos filtros"); return; }
    const blob = new Blob(["\uFEFF" + exportCsv(filteredHistory)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial_helpdesk_${filtroFecha}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-surface">
      <AdpDialog open={adpAskOpen} onConfirm={confirmAdp} current={adp} />

      <header className="border-b bg-background sticky top-0 z-30">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-critical text-critical-foreground font-bold">
              C
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                Asistente Help Desk Claro
              </h1>
              <p className="text-xs text-muted-foreground">
                Instalaciones · Panel local de apoyo operativo
              </p>
            </div>
            <div className="ml-2 flex flex-wrap items-center gap-2">
              {QUICK_LINKS.map((l) => (
                <Button key={l.label} variant="outline" size="sm" asChild>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" title={l.url}>
                    <ExternalLink className="mr-1 h-3.5 w-3.5" /> {l.label}
                  </a>
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
              <SelectTrigger className="h-9 w-[150px]" title="Tema">
                <Palette className="h-4 w-4 shrink-0" />
                <SelectValue className="sr-only" />
                <span className="truncate">Tema</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">☀️ Modo claro</SelectItem>
                <SelectItem value="dark">🌙 Modo oscuro</SelectItem>
                <SelectItem value="halloween">🎃 Modo Halloween</SelectItem>
                <SelectItem value="navidad">🎄 Modo Navidad</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdpAskOpen(true)}
              title="Cambiar ADP activo"
            >
              <User className="mr-2 h-4 w-4" />
              {adp}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              <Trash2 className="mr-2 h-4 w-4" /> Limpiar datos
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-4 px-6 py-5">
        <Alert className="border-warn/40 bg-warn/10">
          <AlertTriangle className="h-4 w-4 text-warn" />
          <AlertTitle className="text-sm">Aviso de privacidad</AlertTitle>
          <AlertDescription className="text-xs">
            Herramienta local de apoyo. No se envía información a servidores externos
            y el historial se guarda únicamente en este navegador.
          </AlertDescription>
        </Alert>

        <section aria-label="Mi atención de hoy" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Mi atención de hoy · {adp}</h2>
            <p className="text-xs text-muted-foreground">{metrics.difference > 0 ? "+" : ""}{metrics.difference} gestiones frente a ayer · Último registro: {metrics.last ? new Date(metrics.last).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "—"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard label="Gestiones guardadas" value={metrics.total} />
            <MetricCard label="SOT atendidas" value={metrics.unique} tone="info" />
            <MetricCard label="Visitas confirmadas" value={metrics.confirmations} tone="success" />
            <MetricCard label="Rechazos registrados" value={metrics.rejections} tone="warn" />
            <MetricCard label="Ciclos de llamadas" value={metrics.calls} tone="info" />
            <MetricCard label="Rescates comerciales" value={metrics.rescues} tone="rescue" />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Panel izquierdo */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" /> Ticket TOA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="Pega aquí el detalle de actividad copiado de TOA..."
                className="min-h-[260px] font-mono text-xs"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{raw.length} caracteres</span>
                {ticket.sotCandidates.length > 1 && (
                  <span className="text-warn">
                    {ticket.sotCandidates.length} SOTs detectados
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={handleAnalyze} className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" /> Analizar ticket
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handleClearTicket}>
                    <Eraser className="mr-2 h-4 w-4" /> Limpiar
                  </Button>
                  <Button variant="secondary" onClick={handleExample}>
                    Ejemplo
                  </Button>
                </div>
              </div>

              {ticket.sotCandidates.length > 1 && (
                <div className="space-y-1 rounded-md border bg-surface-2 p-2 text-xs">
                  <p className="font-medium">Selecciona la SOT correcta:</p>
                  <div className="flex flex-wrap gap-1">
                    {ticket.sotCandidates.map((s) => (
                      <button
                        key={s}
                        onClick={() => setTicket({ ...ticket, sot: s })}
                        className={`rounded-md border px-2 py-1 ${
                          ticket.sot === s
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-md border bg-surface-2 p-2 text-[11px] text-muted-foreground">
                <p className="mb-1 font-semibold text-foreground">Franjas</p>
                <ul className="space-y-0.5">
                  {FRANJAS_INFO.map((f) => (
                    <li key={f.value}>{f.label}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Panel central */}
          <div className="space-y-4 lg:col-span-6">
            {/* Estado de SOT - plantilla seleccionable */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Estado de SOT · Plantilla SGA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Categoría
                    </Label>
                    <Select
                      value={tplCategory}
                      onValueChange={(v) => setTplCategory(v as TemplateCategory)}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Estado / Plantilla
                    </Label>
                    <Select
                      value={tplId}
                      onValueChange={(v) => {
                        setTplId(v);
                        setSubmotivo("");
                        setRespManual(false);
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templatesInCategory.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {currentTpl.submotivos && (
                  <div>
                    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Sub-motivo
                    </Label>
                    <Select value={submotivo} onValueChange={(v) => { setSubmotivo(v); setRespManual(false); }}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Escoger una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentTpl.submotivos.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Textarea
                  value={respuesta}
                  onChange={(e) => { setRespuesta(e.target.value); setRespManual(true); }}
                  className="min-h-[280px] font-mono text-xs"
                  placeholder="La plantilla aparecerá aquí…"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={() => copyText(respuesta, "Plantilla SGA")}>
                    <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar plantilla
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRespManual(false);
                      setRespuesta(
                        renderTemplate(currentTpl, tplVars(ticket, adp, submotivo)),
                      );
                      toast.success("Plantilla regenerada");
                    }}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Regenerar
                  </Button>
                  <div className="flex-1" />
                  <Button variant="secondary" onClick={handleSaveHistory}>
                    <Save className="mr-2 h-4 w-4" /> Guardar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel derecho — Respuesta WhatsApp */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4 text-success" /> Respuesta WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Plantilla rápida
                </Label>
                <Select value={wspId} onValueChange={(v) => { setWspId(v); setWspManual(false); }}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[320px]">
                    {WSP_TEMPLATES.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentWsp.needsSubmotivo && (
                <div>
                  <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Detalle (fecha/franja/motivo)
                  </Label>
                  <Input
                    value={wspExtra}
                    onChange={(e) => { setWspExtra(e.target.value); setWspManual(false); }}
                    placeholder="Ej.: 28/06 PM1"
                    className="h-9 text-sm"
                  />
                </div>
              )}

              <Textarea
                value={wsp}
                onChange={(e) => { setWsp(e.target.value); setWspManual(true); }}
                className="min-h-[180px] text-sm"
                placeholder="Mensaje listo para WhatsApp…"
              />

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => copyText(wsp, "Mensaje WSP")}>
                  <ClipboardCopy className="mr-2 h-4 w-4" /> Copiar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setWspManual(false);
                    setWsp(renderWsp(currentWsp, { SOT: ticket.sot, SUBMOTIVO: wspExtra, FIRMA: adpSignature(adp) }));
                    toast.success("Mensaje regenerado");
                  }}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" /> Regenerar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historial */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> Historial de atención
              <span className="text-xs font-normal text-muted-foreground">
                ({filteredHistory.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3 xl:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar SOT, cliente o estado"
                  className="h-9 pl-7 text-sm"
                />
              </div>
              <Select value={filtroCaso} onValueChange={setFiltroCaso}>
                <SelectTrigger aria-label="Filtrar caso" className="h-9 text-sm">
                  <SelectValue placeholder="Filtrar caso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los casos</SelectItem>
                  {(Object.keys(CASE_LABEL) as CaseType[]).map((c) => (
                    <SelectItem key={c} value={c}>{CASE_LABEL[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" aria-label="Fecha del historial" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value || today)} className="h-9 text-sm" />
              <Select value={filtroAdp} onValueChange={setFiltroAdp}>
                <SelectTrigger aria-label="Filtrar asesor" className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELF">Mis gestiones</SelectItem>
                  <SelectItem value="ALL">Todos los asesores</SelectItem>
                  <SelectItem value="UNKNOWN">Sin asesor registrado</SelectItem>
                  {historyAdps.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger aria-label="Filtrar estado" className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  {historyStates.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={resetFilters}><RefreshCcw className="mr-2 h-4 w-4" /> Hoy · Mis gestiones</Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" /> Exportar CSV
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Fecha</TableHead>
                    <TableHead>SOT</TableHead>
                    <TableHead>Caso</TableHead>
                    <TableHead>Asesor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        Sin registros para la fecha y los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHistory.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(h.fecha).toLocaleString("es-PE", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{h.sot}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`h-2 w-2 rounded-full ${CASE_DOT[h.caso]}`} />
                            {CASE_LABEL[h.caso]}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">{h.adp || "Sin asesor registrado"}</span>
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                          {h.estado || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => copyText(h.respuesta, "Plantilla")}>
                            <ClipboardCopy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteHistory(h.id)}>
                            <Trash2 className="h-4 w-4 text-critical" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Separator />
        <p className="pb-6 text-center text-xs text-muted-foreground">
          Herramienta interna de apoyo · ADP activo: <span className="font-medium">{adp}</span>
        </p>
      </div>

      <SeasonalWidget theme={theme} />
    </div>
  );
}

function AdpDialog({
  open,
  onConfirm,
  current,
}: {
  open: boolean;
  onConfirm: (n: string) => void;
  current: string;
}) {
  const [selected, setSelected] = useState<string>(current || "Jhostin Baldeon");
  const [custom, setCustom] = useState("");
  useEffect(() => { setSelected(current || "Jhostin Baldeon"); }, [current, open]);

  return (
    <Dialog open={open} onOpenChange={() => { /* forzado: requiere confirmar */ }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>¿Qué ADP eres?</DialogTitle>
          <DialogDescription>
            Esto se usará para autocompletar el campo "Realizado por" en las plantillas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADP_OPTIONS.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected === "Otro" && (
            <Input
              autoFocus
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Escribe tu nombre"
            />
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              const name = selected === "Otro" ? custom.trim() : selected;
              if (!name) return;
              onConfirm(name);
            }}
          >
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  action,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  action?: React.ReactNode;
}) {
  const detected = value && value.trim().length > 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        <span
          className={`text-[10px] font-medium ${
            detected ? "text-success" : "text-muted-foreground"
          }`}
        >
          {detected ? "OK" : "No detectado"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className="h-8 text-xs"
        />
        {action}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "critical" | "warn" | "info" | "success" | "rescue";
}) {
  const toneClass =
    tone === "critical" ? "text-critical"
      : tone === "warn" ? "text-warn"
      : tone === "info" ? "text-info"
      : tone === "success" ? "text-success"
      : tone === "rescue" ? "text-rescue"
      : "text-foreground";
  return (
    <Card>
      <CardContent className="py-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`text-2xl font-semibold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
