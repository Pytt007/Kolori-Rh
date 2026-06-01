import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTRACT_TYPES, type ContractType } from "@/lib/recruiter";

export type OfferFormValues = {
  titre: string;
  description: string;
  contrat: ContractType;
  secteur: string;
  localisation: string;
  teletravail: string;
  salaire_min: string;
  salaire_max: string;
  competences_requises: string;
};

export function OfferForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<OfferFormValues>;
  onSubmit: (v: OfferFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const [form, setForm] = useState<OfferFormValues>({
    titre: initial?.titre ?? "",
    description: initial?.description ?? "",
    contrat: (initial?.contrat as ContractType) ?? "CDI",
    secteur: initial?.secteur ?? "",
    localisation: initial?.localisation ?? "",
    teletravail: initial?.teletravail ?? "",
    salaire_min: initial?.salaire_min ?? "",
    salaire_max: initial?.salaire_max ?? "",
    competences_requises: initial?.competences_requises ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try { await onSubmit(form); } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handle} className="max-w-3xl space-y-6">
      <div>
        <Label htmlFor="titre">Intitulé du poste *</Label>
        <Input id="titre" required value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Type de contrat *</Label>
          <Select value={form.contrat} onValueChange={(v) => setForm({ ...form, contrat: v as ContractType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONTRACT_TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="secteur">Secteur</Label>
          <Input id="secteur" value={form.secteur} onChange={(e) => setForm({ ...form, secteur: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="localisation">Localisation</Label>
          <Input id="localisation" value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="teletravail">Télétravail</Label>
          <Input id="teletravail" placeholder="Non / Partiel / Full remote" value={form.teletravail} onChange={(e) => setForm({ ...form, teletravail: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="smin">Salaire min (€/an)</Label>
          <Input id="smin" type="number" value={form.salaire_min} onChange={(e) => setForm({ ...form, salaire_min: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="smax">Salaire max (€/an)</Label>
          <Input id="smax" type="number" value={form.salaire_max} onChange={(e) => setForm({ ...form, salaire_max: e.target.value })} />
        </div>
      </div>

      <div>
        <Label htmlFor="comp">Compétences requises (séparées par des virgules)</Label>
        <Input id="comp" placeholder="React, TypeScript, Figma" value={form.competences_requises} onChange={(e) => setForm({ ...form, competences_requises: e.target.value })} />
      </div>

      <div>
        <Label htmlFor="desc">Description du poste *</Label>
        <Textarea id="desc" required rows={10} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <Button type="submit" disabled={saving}>{saving ? "Enregistrement…" : submitLabel}</Button>
    </form>
  );
}

export function serializeOffer(v: OfferFormValues) {
  return {
    titre: v.titre,
    description: v.description,
    contrat: v.contrat,
    secteur: v.secteur || null,
    localisation: v.localisation || null,
    teletravail: v.teletravail || null,
    salaire_min: v.salaire_min ? Number(v.salaire_min) : null,
    salaire_max: v.salaire_max ? Number(v.salaire_max) : null,
    competences_requises: v.competences_requises
      ? v.competences_requises.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
  };
}
