"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/lib/hooks/use-categories-tags";
import { ImportCsvSection } from "@/components/import/import-csv-section";

export default function ImportExportPage() {
  const [scope, setScope] = useState("all");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("");
  const { categories } = useCategories();

  function buildExportUrl(format: "csv" | "xlsx") {
    const params = new URLSearchParams({ format, scope });
    if (scope === "month") params.set("month", month);
    if (scope === "year") params.set("year", year);
    if (scope === "range") {
      params.set("dateFrom", dateFrom);
      params.set("dateTo", dateTo);
    }
    if (categoryId) params.set("categoryId", categoryId);
    if (type) params.set("type", type);
    return `/api/export?${params.toString()}`;
  }

  function handleExport(format: "csv" | "xlsx") {
    window.location.href = buildExportUrl(format);
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Import & Export</h1>
        <p className="text-sm text-muted-foreground">Kelola data transaksimu secara massal</p>
      </div>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base font-semibold flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cakupan Data</label>
              <Select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="all">Semua Data</option>
                <option value="month">Bulan Tertentu</option>
                <option value="year">Tahun Tertentu</option>
                <option value="range">Rentang Tanggal</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Jenis Transaksi</label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Semua Jenis</option>
                <option value="INCOME">Pemasukan</option>
                <option value="EXPENSE">Pengeluaran</option>
              </Select>
            </div>
          </div>

          {scope === "month" && (
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          )}
          {scope === "year" && (
            <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" />
          )}
          {scope === "range" && (
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Kategori (opsional)</label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => handleExport("csv")}>
              <FileText className="h-4 w-4" /> Export CSV
            </Button>
            <Button className="flex-1" onClick={() => handleExport("xlsx")}>
              <FileSpreadsheet className="h-4 w-4" /> Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import */}
      <ImportCsvSection />
    </div>
  );
}
