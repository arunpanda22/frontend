"use client"

import { useState, useEffect } from "react"
import { Loader2, Check, Save, Plus, Trash2, Film, BadgeCheck, Zap, Clock } from 'lucide-react'
import { Image } from 'lucide-react'
import {
  Input,
  NumberInput,
  Select,
  SectionCard,
} from './components/FormFields'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useUserProfile } from '@/lib/hooks/queries/use-user-profile'
import { useUpdateTargetAcos } from "@/lib/hooks/queries/use-update-target-acos"
import {
  useAssets,
  useBrands,
  useCreateAsset,
  useDeleteAsset,
  useCreateBrand,
  useDeleteBrand,
  type AssetType,
  type CreateAssetPayload,
  type CreateBrandPayload,
} from '@/lib/hooks/queries/use-assets-brands'
import {
  useScriptVersions,
  useScriptConfigs,
  useUpdateScriptConfig,
  type ScriptType,
  type TenantScriptConfig,
} from '@/lib/hooks/queries/use-script-config'
import { AssetBulkPasteSection } from "./components/AssetBulkPasteSection"

// ── Asset type config ─────────────────────────────────────────────────────────

const ASSET_TYPE_OPTIONS = [
  { value: 'VIDEO',      label: 'Video'       },
  { value: 'IMAGE',      label: 'Custom Image' },
  { value: 'BRAND_LOGO', label: 'Brand Logo'  },
]

const ASSET_TYPE_ICONS: Record<AssetType, React.ReactNode> = {
  VIDEO:      <Film       className="h-3.5 w-3.5" />,
  IMAGE:      <Image      className="h-3.5 w-3.5" />,
  BRAND_LOGO: <BadgeCheck className="h-3.5 w-3.5" />,
}

const emptyAsset = (): CreateAssetPayload => ({
  asset_name: '', asset_id: '', asset_type: 'VIDEO', asin: '', asset_url: '',
})

const emptyBrand = (): CreateBrandPayload => ({
  brand_name: '', brand_entity_id: '',
})

// ── Script config row sub-component ──────────────────────────────────────────

interface ScriptConfigRowProps {
  type:        ScriptType
  label:       string
  description: string
  icon:        React.ReactNode
  config:      TenantScriptConfig | undefined
}

function ScriptConfigRow({ type, label, description, icon, config }: ScriptConfigRowProps) {
  const { data: versions = [] } = useScriptVersions(type)
  const updateConfig            = useUpdateScriptConfig()

  const [selectedVersion, setSelectedVersion] = useState<string>(config?.script_version ?? '')
  const [isEnabled,       setIsEnabled]       = useState<boolean>(config?.is_enabled ?? false)
  const [saved,           setSaved]           = useState(false)

  // Sync local state when server data arrives
  useEffect(() => {
    setSelectedVersion(config?.script_version ?? '')
    setIsEnabled(config?.is_enabled ?? false)
  }, [config?.script_version, config?.is_enabled])

  const isDirty =
    selectedVersion !== (config?.script_version ?? '') ||
    isEnabled       !== (config?.is_enabled      ?? false)

  const handleSave = async () => {
    await updateConfig.mutateAsync({
      type,
      script_version: selectedVersion || null,
      is_enabled:     isEnabled,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const versionOptions = [
    { value: '', label: 'No version selected' },
    ...versions.map((v) => ({ value: v.id, label: v.version })),
  ]

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-5">

      {/* Header row: icon + text on left, toggle on right */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            {icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">{label}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>

        {/* Enabled toggle */}
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <span className="text-xs text-slate-500">{isEnabled ? 'Enabled' : 'Disabled'}</span>
          <button
            type="button"
            onClick={() => setIsEnabled((v) => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none ${
              isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              isEnabled ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Version select + save button */}
      <div className="flex items-end gap-3">
        <div className="w-56">
          <Select
            label="Script Version"
            options={versionOptions}
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || updateConfig.isPending}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 mb-px"
        >
          {updateConfig.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <><Check className="h-4 w-4" /> Saved</>
          ) : (
            <><Save className="h-4 w-4" /> Save</>
          )}
        </button>
      </div>

      {/* Currently-active version footer */}
      {config?.script_version_detail && (
        <p className="text-xs text-slate-400">
          Currently active:&nbsp;
          <span className="font-mono font-medium text-slate-600">
            {config.script_version_detail.version}
          </span>
          &nbsp;·&nbsp;last updated&nbsp;
          {new Date(config.updated_at).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </p>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ConfigurationPage() {

  // ── Target ACOS ─────────────────────────────────────────────────────────────
  const { data: userProfile }      = useUserProfile()
  const currentAcos                 = userProfile?.connected_advertising_profiles
                                        ?.find((p) => p.is_active)?.target_acos ?? null
  const [targetAcos, setTargetAcos] = useState<number>(Number(currentAcos))
  const [acosSaved,  setAcosSaved]  = useState(false)
  const updateAcos                  = useUpdateTargetAcos()

  const handleAcosSubmit = async () => {
    await updateAcos.mutateAsync({ target_acos: targetAcos })
    setAcosSaved(true)
    setTimeout(() => setAcosSaved(false), 2000)
  }

  // ── Automated optimization scripts ──────────────────────────────────────────
  const { data: scriptConfigs = [], isLoading: configsLoading } = useScriptConfigs()
  const dailyConfig      = scriptConfigs.find((c) => c.script_type === 'daily')
  const daypartingConfig = scriptConfigs.find((c) => c.script_type === 'dayparting')

  // ── Assets ───────────────────────────────────────────────────────────────────
  const { data: assets = [], isLoading: assetsLoading } = useAssets()
  const createAsset = useCreateAsset()
  const deleteAsset = useDeleteAsset()
  const [assetForm,  setAssetForm]  = useState<CreateAssetPayload>(emptyAsset)
  const [assetError, setAssetError] = useState<string | null>(null)
  const [assetMode,  setAssetMode]  = useState<'single' | 'bulk'>('single')

  const handleCreateAsset = async () => {
    if (!assetForm.asset_name.trim() || !assetForm.asset_id.trim()) {
      setAssetError('Asset name and Asset ID are required.')
      return
    }
    setAssetError(null)
    await createAsset.mutateAsync({
      ...assetForm,
      asin:      assetForm.asin?.trim()      || undefined,
      asset_url: assetForm.asset_url?.trim() || undefined,
    })
    setAssetForm(emptyAsset())
  }

  // ── Brands ───────────────────────────────────────────────────────────────────
  const { data: brands = [], isLoading: brandsLoading } = useBrands()
  const createBrand = useCreateBrand()
  const deleteBrand = useDeleteBrand()
  const [brandForm,  setBrandForm]  = useState<CreateBrandPayload>(emptyBrand)
  const [brandError, setBrandError] = useState<string | null>(null)

  const handleCreateBrand = async () => {
    if (!brandForm.brand_name.trim() || !brandForm.brand_entity_id.trim()) {
      setBrandError('Brand name and Brand Entity ID are required.')
      return
    }
    setBrandError(null)
    await createBrand.mutateAsync(brandForm)
    setBrandForm(emptyBrand())
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 p-6 mx-8">

      <div className="mb-2">
        <h1 className="text-xl font-semibold text-slate-800">Configuration</h1>
        <p className="text-sm text-slate-500">Manage your campaign and account settings</p>
      </div>

      {/* ── Target ACOS ──────────────────────────────────────────────────────── */}
      <SectionCard
        title="Target ACOS"
        description="Set your target Advertising Cost of Sales"
      >
        <div className="flex items-end gap-4">
          <div className="max-w-[180px]">
            <NumberInput
              label={currentAcos !== null ? `Target ACOS (current: ${currentAcos}%)` : 'Target ACOS (%)'}
              value={targetAcos}
              min={1}
              max={1000}
              onChange={(e) => setTargetAcos(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
            />
          </div>
          <button
            type="button"
            onClick={handleAcosSubmit}
            disabled={updateAcos.isPending}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 mb-px"
          >
            {updateAcos.isPending ? <Loader2 className="h-4 w-4 animate-spin" />
              : acosSaved ? <><Check className="h-4 w-4" /> Saved</>
              : <><Save className="h-4 w-4" /> Save</>}
          </button>
        </div>
      </SectionCard>

      {/* ── Automated Optimization ───────────────────────────────────────────── */}
      <SectionCard
        title="Automated Optimization"
        description="Control which script version runs for each optimization type and whether it is active for your account"
      >
        {configsLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading configuration…
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <ScriptConfigRow
              type="daily"
              label="Daily Optimization"
              description="Runs bid and budget adjustments once per day based on recent performance"
              icon={<Zap className="h-4 w-4" />}
              config={dailyConfig}
            />
            <ScriptConfigRow
              type="dayparting"
              label="Dayparting Optimization"
              description="Adjusts budgets and bids throughout the day during peak conversion windows"
              icon={<Clock className="h-4 w-4" />}
              config={daypartingConfig}
            />
          </div>
        )}
      </SectionCard>

      {/* ── Creative Assets ───────────────────────────────────────────────────── */}
      <SectionCard
        title="Creative Assets"
        description="Store your Amazon Asset Library IDs for use in Sponsored Brands campaigns"
      >
        <div className="flex flex-col gap-5">

          {/* Mode toggle */}
          <div className="flex gap-2">
            {([
              { value: 'single' as const, label: 'Single Asset' },
              { value: 'bulk'   as const, label: 'Bulk Paste'   },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAssetMode(opt.value)}
                className={`rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-150
                  ${assetMode === opt.value
                    ? 'border-indigo-300 bg-indigo-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Single asset form */}
          {assetMode === 'single' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Asset Name *"
                  placeholder="e.g. Summer Brand Video"
                  value={assetForm.asset_name}
                  onChange={(e) => setAssetForm((f) => ({ ...f, asset_name: e.target.value }))}
                  error={assetError && !assetForm.asset_name.trim() ? 'Required' : undefined}
                />
                <Select
                  label="Asset Type *"
                  options={ASSET_TYPE_OPTIONS}
                  value={assetForm.asset_type}
                  onChange={(e) => setAssetForm((f) => ({ ...f, asset_type: e.target.value as AssetType }))}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Asset ID *"
                    placeholder="amzn1.assetlibrary.asset1.xxx:version_v1"
                    value={assetForm.asset_id}
                    onChange={(e) => setAssetForm((f) => ({ ...f, asset_id: e.target.value }))}
                    error={assetError && !assetForm.asset_id.trim() ? 'Required' : undefined}
                    className="font-mono text-xs"
                  />
                </div>
                <Input
                  label={assetForm.asset_type === 'BRAND_LOGO' ? 'Brand Name *' : 'ASIN *'}
                  placeholder={assetForm.asset_type === 'BRAND_LOGO' ? 'e.g. Skillofun' : 'e.g. B009GCTZWC'}
                  value={assetForm.asin ?? ''}
                  onChange={(e) => setAssetForm((f) => ({ ...f, asin: e.target.value }))}
                  className={assetForm.asset_type !== 'BRAND_LOGO' ? 'font-mono' : ''}
                />
                <Input
                  label="Preview URL *"
                  placeholder="https://..."
                  value={assetForm.asset_url ?? ''}
                  onChange={(e) => setAssetForm((f) => ({ ...f, asset_url: e.target.value }))}
                />
              </div>
              {assetError && <p className="text-xs text-red-500">{assetError}</p>}
              <button
                type="button"
                onClick={handleCreateAsset}
                disabled={createAsset.isPending}
                className="flex items-center gap-1.5 w-fit rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-60"
              >
                {createAsset.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add Asset
              </button>
            </>
          )}

          {/* Bulk paste */}
          {assetMode === 'bulk' && (
            <AssetBulkPasteSection onSaved={() => setAssetMode('single')} />
          )}

          {/* Assets table */}
          {assetsLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading assets…
            </div>
          ) : assets.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Name', 'Type', 'Asset ID', 'ASIN / Brand', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="group">
                      <td className="px-4 py-3 font-medium text-slate-800">{asset.asset_name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {ASSET_TYPE_ICONS[asset.asset_type]}
                          {asset.asset_type_display}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[160px] truncate font-mono text-xs text-slate-400">{asset.asset_id}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{asset.asin ?? '—'}</td>
                      <td className="px-2 py-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="rounded p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-400 transition">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete asset?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove <strong>{asset.asset_name}</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteAsset.mutate(asset.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-400 py-4">No assets added yet.</p>
          )}
        </div>
      </SectionCard>

      {/* ── Brands ───────────────────────────────────────────────────────────── */}
      <SectionCard
        title="Brands"
        description="Store your Amazon brand entity IDs for Sponsored Brands campaigns"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Brand Name *"
              placeholder="e.g. Skillofun"
              value={brandForm.brand_name}
              onChange={(e) => setBrandForm((f) => ({ ...f, brand_name: e.target.value }))}
              error={brandError && !brandForm.brand_name.trim() ? 'Required' : undefined}
            />
            <Input
              label="Brand Entity ID *"
              placeholder="e.g. ENTITY1A2B3C4D"
              value={brandForm.brand_entity_id}
              onChange={(e) => setBrandForm((f) => ({ ...f, brand_entity_id: e.target.value }))}
              error={brandError && !brandForm.brand_entity_id.trim() ? 'Required' : undefined}
              className="font-mono"
            />
          </div>
          {brandError && <p className="text-xs text-red-500">{brandError}</p>}
          <button
            type="button"
            onClick={handleCreateBrand}
            disabled={createBrand.isPending}
            className="flex items-center gap-1.5 w-fit rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-60"
          >
            {createBrand.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add Brand
          </button>

          {brandsLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading brands…
            </div>
          ) : brands.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Brand Name', 'Entity ID', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {brands.map((brand) => (
                    <tr key={brand.id} className="group">
                      <td className="px-4 py-3 font-medium text-slate-800">{brand.brand_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{brand.brand_entity_id}</td>
                      <td className="px-2 py-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="rounded p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-400 transition">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete brand?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove <strong>{brand.brand_name}</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteBrand.mutate(brand.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-sm text-slate-400 py-4">No brands added yet.</p>
          )}
        </div>
      </SectionCard>

    </div>
  )
}

export default ConfigurationPage