
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { formatCurrency } from '../../lib/drawEngine'
import {
  Trophy, Upload, CheckCircle, XCircle, Clock, Banknote, Crown,
  Medal, Star, AlertTriangle, FileImage, Eye, RefreshCw, Loader2,
  ChevronDown, ChevronUp, Info, Sparkles, ArrowRight, X, Shield,
  TrendingUp, Wallet, CheckCheck
} from 'lucide-react'

/* ─── Status config ─── */
const STATUS_CONFIG = {
  pending: {
    label: 'Action Required',
    sublabel: 'Upload your score screenshot to claim your prize',
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    dot: 'bg-amber-400',
    step: 1,
  },
  proof_submitted: {
    label: 'Under Review',
    sublabel: 'Your proof has been submitted and is being reviewed by our team',
    icon: Shield,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    dot: 'bg-sky-400',
    step: 2,
  },
  approved: {
    label: 'Approved — Awaiting Payment',
    sublabel: 'Your prize has been approved! Payment will be processed shortly',
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    dot: 'bg-emerald-400',
    step: 3,
  },
  rejected: {
    label: 'Proof Rejected',
    sublabel: 'Your proof was not accepted. Please re-upload a valid screenshot',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    badge: 'bg-red-500/20 text-red-300 border border-red-500/30',
    dot: 'bg-red-400',
    step: 1,
  },
  paid: {
    label: 'Paid!',
    sublabel: 'Congratulations! Your prize has been paid out',
    icon: Banknote,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    badge: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    dot: 'bg-violet-400',
    step: 4,
  },
}

const TIER_CONFIG = {
  5: { label: '5-Match Jackpot', icon: Crown, gradient: 'from-amber-400 to-orange-500' },
  4: { label: '4-Number Match', icon: Medal, gradient: 'from-sky-400 to-blue-500' },
  3: { label: '3-Number Match', icon: Star, gradient: 'from-emerald-400 to-green-500' },
}

/* ─── Progress Steps ─── */
function VerificationSteps({ currentStep }) {
  const steps = [
    { n: 1, label: 'Upload Proof' },
    { n: 2, label: 'Under Review' },
    { n: 3, label: 'Approved' },
    { n: 4, label: 'Paid' },
  ]
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-1 sm:gap-2">
          <div className={`flex items-center gap-1.5 ${
            s.n < currentStep ? 'text-emerald-400' :
            s.n === currentStep ? 'text-amber-400' : 'text-slate-600'
          }`}>
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all shrink-0
              ${s.n < currentStep ? 'bg-emerald-500 border-emerald-400 text-white' :
                s.n === currentStep ? 'bg-amber-500/20 border-amber-400 text-amber-400' :
                'bg-slate-800 border-slate-700 text-slate-600'}`}>
              {s.n < currentStep ? <CheckCheck className="h-3 w-3" /> : s.n}
            </div>
            <span className="text-[10px] sm:text-xs font-semibold hidden sm:block">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-4 sm:w-8 transition-all ${s.n < currentStep ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Proof Upload Modal ─── */
function ProofUploadModal({ winner, onClose, onSuccess }) {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB')
      return
    }
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target.result)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  const handleSubmit = async () => {
    if (!file) return toast.error('Please select a file first')
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${winner.id}_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('winner-proofs')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('winner-proofs')
        .getPublicUrl(path)

      const { error: fnError } = await supabase.rpc('submit_winner_proof', {
        p_winner_id: winner.id,
        p_proof_url: urlData.publicUrl,
        p_proof_storage_path: path,
      })

      if (fnError) throw fnError

      toast.success('Proof submitted! We\'ll review it shortly 🎉')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2">
              <Upload className="h-4 w-4 text-amber-400" /> Upload Score Proof
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Prize: <span className="text-amber-400 font-semibold">{formatCurrency(winner.prize_amount)}</span>
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info box */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex gap-3">
            <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">What to upload:</p>
              <p>A clear screenshot from your golf platform showing your scores for the draw period.</p>
              <p>Make sure your <span className="text-slate-200 font-medium">username/email is visible</span> in the screenshot.</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
              ${dragOver ? 'border-amber-400 bg-amber-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/40'}`}
          >
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-xl object-contain" />
                <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {file.name}
                </p>
                <p className="text-[10px] text-slate-500">Click to replace</p>
              </div>
            ) : file ? (
              <div className="space-y-2">
                <FileImage className="h-10 w-10 text-amber-400 mx-auto" />
                <p className="text-sm text-slate-300 font-semibold">{file.name}</p>
                <p className="text-[10px] text-slate-500">Click to replace</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-700 flex items-center justify-center mx-auto">
                  <Upload className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-300">Drop your screenshot here</p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse · JPG, PNG, PDF · Max 10MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Rejected reason */}
          {winner.status === 'rejected' && winner.admin_notes && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <p className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> Previous rejection reason:
              </p>
              <p className="text-xs text-red-300">{winner.admin_notes}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-900 text-sm font-bold disabled:opacity-50 transition-all shadow-lg shadow-amber-900/30"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Submit Proof'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Single Winner Card ─── */
function WinnerCard({ winner, onUpload }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[winner.status] || STATUS_CONFIG.pending
  const tierCfg = TIER_CONFIG[winner.match_count] || TIER_CONFIG[3]
  const TierIcon = tierCfg.icon
  const StatusIcon = cfg.icon

  const canUpload = winner.status === 'pending' || winner.status === 'rejected'

  return (
    <div className={`rounded-3xl border overflow-hidden transition-all duration-300 ${cfg.bg} ${cfg.border}`}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Tier badge */}
          <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${tierCfg.gradient} flex items-center justify-center shadow-lg shrink-0`}>
            <TierIcon className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-black text-white text-base">{tierCfg.label}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cfg.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">{winner.draws?.month_year}</p>

            {/* Prize amount */}
            <p className={`text-3xl font-black ${cfg.color}`}>
              {formatCurrency(winner.prize_amount)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{cfg.sublabel}</p>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 rounded-xl bg-slate-800/60 flex items-center justify-center hover:bg-slate-700/60 transition shrink-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
        </div>

        {/* Progress steps */}
        <div className="mt-5 pt-4 border-t border-slate-700/40">
          <VerificationSteps currentStep={cfg.step} />
        </div>

        {/* CTA */}
        {canUpload && (
          <button
            onClick={() => onUpload(winner)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-900 font-bold text-sm transition-all shadow-lg shadow-amber-900/30"
          >
            <Upload className="h-4 w-4" />
            {winner.status === 'rejected' ? 'Re-upload Proof' : 'Upload Score Proof'}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {winner.status === 'paid' && (
          <div className="mt-4 flex items-center gap-2 py-3 px-4 rounded-2xl bg-violet-500/10 border border-violet-500/30">
            <Banknote className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-violet-300 font-semibold">
              Paid on {winner.paid_at ? new Date(winner.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              {winner.payment_reference && ` · Ref: ${winner.payment_reference}`}
            </span>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-700/40 px-5 sm:px-6 pb-5 pt-4 space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timeline</p>

          {[
            { date: winner.created_at, label: 'Prize awarded', show: true },
            { date: winner.proof_submitted_at, label: 'Proof submitted', show: !!winner.proof_submitted_at },
            { date: winner.reviewed_at, label: winner.status === 'rejected' ? 'Proof rejected' : 'Proof approved', show: !!winner.reviewed_at },
            { date: winner.paid_at, label: 'Payment sent', show: !!winner.paid_at },
          ].filter(t => t.show).map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0 ml-0.5" />
              <p className="text-xs text-slate-400">
                <span className="text-slate-300 font-medium">{t.label}</span>
                {' · '}
                {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}

          {winner.admin_notes && winner.status === 'rejected' && (
            <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Admin note</p>
              <p className="text-xs text-red-300">{winner.admin_notes}</p>
            </div>
          )}

          {winner.proof_url && (
            <a
              href={winner.proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium mt-1 transition"
            >
              <Eye className="h-3.5 w-3.5" /> View submitted proof
            </a>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function WinnerVerification() {
  const { user } = useAuth()
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadTarget, setUploadTarget] = useState(null)

  const fetchWinners = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('winners')
      .select('*, draws(month_year, winning_numbers)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) toast.error('Failed to load winnings')
    else setWinners(data || [])
    setLoading(false)
  }, [user?.id])

  useEffect(() => { fetchWinners() }, [fetchWinners])

  const totalWon = winners.filter(w => w.status === 'paid').reduce((s, w) => s + Number(w.prize_amount || 0), 0)
  const pendingPayout = winners.filter(w => w.status === 'approved').reduce((s, w) => s + Number(w.prize_amount || 0), 0)
  const actionRequired = winners.filter(w => w.status === 'pending' || w.status === 'rejected').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" /> My Winnings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Track your prizes and verification status</p>
        </div>
        <button onClick={fetchWinners} className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition">
          <RefreshCw className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Paid Out', value: formatCurrency(totalWon), icon: Wallet, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
          { label: 'Pending Payout', value: formatCurrency(pendingPayout), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
          { label: 'Action Required', value: actionRequired, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.bg} ${s.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Winners list */}
      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <p className="text-slate-500 text-sm">Loading your winnings…</p>
        </div>
      ) : winners.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/30 rounded-3xl border border-slate-800">
          <div className="h-16 w-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-slate-600" />
          </div>
          <p className="text-slate-400 font-semibold">No winnings yet</p>
          <p className="text-slate-600 text-sm mt-1">Keep playing — your win is coming!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {winners.map(w => (
            <WinnerCard key={w.id} winner={w} onUpload={setUploadTarget} />
          ))}
        </div>
      )}

      {/* Upload modal */}
      {uploadTarget && (
        <ProofUploadModal
          winner={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onSuccess={fetchWinners}
        />
      )}
    </div>
  )
}