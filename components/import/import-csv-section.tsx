"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Upload, Download, Loader2, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface PreviewRow {
  rowIndex: number;
  title: string;
  amount: number | null;
  type: "INCOME" | "EXPENSE" | null;
  categoryName: string | null;
  categoryId: string | null;
  categoryMatched: boolean;
  date: string | null;
  paymentMethod: string;
  tags: string[];
  note: string | null;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
  rowHash: string;
}

export function ImportCsvSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [delimiter, setDelimiter] = useState(",");
  const [rawRows, setRawRows] = useState<Record<string, string>[] | null>(null);
  const [preview, setPreview] = useState<{ rows: PreviewRow[]; summary: { total: number; valid: number; invalid: number; duplicate: number } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  function handleDownloadTemplate() {
    window.location.href = "/api/import/template";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("File import harus berupa CSV");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setFileName(file.name);
    setPreview(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter,
      complete: (results) => {
        setRawRows(results.data);
      },
      error: () => {
        toast.error("Gagal membaca file CSV");
      },
    });
  }

  async function handlePreview() {
    if (!rawRows || rawRows.length === 0) {
      toast.error("Tidak ada data untuk di-preview");
      return;
    }
    setLoading(true);

    const rows = rawRows.map((r) => ({
      title: r["Judul"] ?? r["judul"] ?? "",
      amount: r["Nominal"] ?? r["nominal"] ?? "",
      type: r["Jenis"] ?? r["jenis"] ?? "",
      category: r["Kategori"] ?? r["kategori"] ?? "",
      date: r["Tanggal"] ?? r["tanggal"] ?? "",
      paymentMethod: r["Metode Pembayaran"] ?? r["metode pembayaran"] ?? "",
      tags: r["Tag"] ?? r["tag"] ?? "",
      note: r["Catatan"] ?? r["catatan"] ?? "",
    }));

    try {
      const res = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, dateFormat }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal memproses file");
        return;
      }
      setPreview(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!preview) return;
    const validRows = preview.rows.filter((r) => r.isValid && (!skipDuplicates || !r.isDuplicate));

    if (validRows.length === 0) {
      toast.error("Tidak ada baris valid untuk diimport");
      return;
    }

    setCommitting(true);
    try {
      const res = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          rows: validRows.map((r) => ({
            title: r.title,
            amount: r.amount,
            type: r.type,
            categoryId: r.categoryId,
            date: r.date,
            paymentMethod: r.paymentMethod,
            tags: r.tags,
            note: r.note,
            rowHash: r.rowHash,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Gagal mengimport data");
        return;
      }
      toast.success(`${data.created} transaksi berhasil diimport`);
      handleCancel();
    } finally {
      setCommitting(false);
    }
  }

  function handleCancel() {
    setFileName(null);
    setRawRows(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground text-base font-semibold flex items-center gap-2">
          <Upload className="h-4 w-4" /> Import CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 text-sm text-primary font-medium hover:underline w-fit"
        >
          <Download className="h-3.5 w-3.5" /> Unduh template CSV
        </button>

        {!preview && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Format Tanggal</label>
                <Select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Pemisah Kolom</label>
                <Select value={delimiter} onChange={(e) => setDelimiter(e.target.value)}>
                  <option value=",">Koma (,)</option>
                  <option value=";">Titik koma (;)</option>
                </Select>
              </div>
            </div>

            <label className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {fileName ?? "Klik untuk pilih file CSV (maks 5MB)"}
              </span>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>

            {rawRows && (
              <Button onClick={handlePreview} disabled={loading}>
                {loading && <Loader2 className="animate-spin" />}
                Preview Data ({rawRows.length} baris)
              </Button>
            )}
          </>
        )}

        {preview && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-success-soft p-3 text-center">
                <p className="text-lg font-semibold text-success">{preview.summary.valid}</p>
                <p className="text-xs text-muted-foreground">Valid</p>
              </div>
              <div className="rounded-lg bg-warning-soft p-3 text-center">
                <p className="text-lg font-semibold text-warning">{preview.summary.duplicate}</p>
                <p className="text-xs text-muted-foreground">Duplikat</p>
              </div>
              <div className="rounded-lg bg-danger-soft p-3 text-center">
                <p className="text-lg font-semibold text-danger">{preview.summary.invalid}</p>
                <p className="text-xs text-muted-foreground">Tidak Valid</p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Lewati transaksi duplikat saat import
            </label>

            <div className="max-h-72 overflow-y-auto border border-border rounded-lg">
              {preview.rows.map((row) => (
                <div
                  key={row.rowIndex}
                  className="flex items-center justify-between px-3 py-2 border-b border-border last:border-0 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {row.isValid ? (
                      row.isDuplicate ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      )
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-danger shrink-0" />
                    )}
                    <span className="truncate text-foreground">
                      {row.title || `Baris ${row.rowIndex + 1}`}
                    </span>
                    {row.isDuplicate && <Badge variant="warning">Duplikat</Badge>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {row.amount !== null && (
                      <span className="text-muted-foreground">{formatCurrency(row.amount)}</span>
                    )}
                    {!row.isValid && (
                      <span className="text-danger">{row.errors[0]}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                <X className="h-4 w-4" /> Batalkan
              </Button>
              <Button className="flex-1" onClick={handleCommit} disabled={committing}>
                {committing && <Loader2 className="animate-spin" />}
                Import Data Valid
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
