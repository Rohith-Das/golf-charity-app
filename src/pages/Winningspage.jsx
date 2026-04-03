
import { Link } from 'react-router-dom'
import Navbar from './Navbar'
import WinnerVerification from '../components/winners/Winnerverification '
import { ArrowLeft } from 'lucide-react'

export default function WinningsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <WinnerVerification />
      </div>
    </div>
  )
}