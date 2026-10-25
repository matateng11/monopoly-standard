import React from 'react';
import { X, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-300 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-stone-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
            <BookOpen size={18} className="text-amber-400" /> Buku Panduan Aturan Resmi Monopoli
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-800 transition-colors cursor-pointer text-stone-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Rules Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-stone-700 leading-relaxed">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div className="font-bold text-amber-900 text-sm mb-1">Tujuan Permainan</div>
            <p>
              Menjadi pemain terkaya yang bertahan hingga akhir dengan membeli, menyewakan, dan memperdagangkan properti, sampai pemain lain bangkrut.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-black text-stone-900 text-xs uppercase flex items-center gap-1.5 text-emerald-800">
                <CheckCircle size={14} /> 1. Modal Awal &amp; Petak MULAI
              </h4>
              <p className="mt-1">
                Setiap pemain memulai dengan uang tunai <span className="font-bold">$1,500</span>. Setiap kali Anda melewati atau mendarat tepat di petak MULAI, Anda berhak menerima gaji sebesar <span className="font-bold text-emerald-700">$200</span> dari Bank.
              </p>
            </div>

            <div>
              <h4 className="font-black text-stone-900 text-xs uppercase flex items-center gap-1.5 text-blue-800">
                <CheckCircle size={14} /> 2. Lemparan Dadu Kembar (Double)
              </h4>
              <p className="mt-1">
                Jika kedua mata dadu bernilai sama, Anda mendapatkan giliran melempar dadu lagi. Namun, jika Anda melempar angka kembar 3 kali berturut-turut dalam satu giliran, Anda langsung dijebloskan ke penjara karena mengebut!
              </p>
            </div>

            <div>
              <h4 className="font-black text-stone-900 text-xs uppercase flex items-center gap-1.5 text-purple-800">
                <CheckCircle size={14} /> 3. Pembelian &amp; Lelang Properti
              </h4>
              <p className="mt-1">
                Jika mendarat di petak properti tanpa pemilik, Anda dapat membelinya dengan harga resmi. Jika Anda menolak membelinya, petak tersebut akan dilelang secara terbuka oleh Bank kepada semua pemain, dengan tawaran awal $10.
              </p>
            </div>

            <div>
              <h4 className="font-black text-stone-900 text-xs uppercase flex items-center gap-1.5 text-amber-800">
                <CheckCircle size={14} /> 4. Membangun Rumah &amp; Hotel
              </h4>
              <p className="mt-1">
                Anda hanya dapat membangun rumah setelah memiliki SELURUH properti dalam satu kelompok warna (Monopoli). Pembangunan harus merata: selisih jumlah rumah pada petak dalam satu grup tidak boleh lebih dari 1. Empat rumah dapat ditingkatkan menjadi satu Hotel.
              </p>
            </div>

            <div>
              <h4 className="font-black text-stone-900 text-xs uppercase flex items-center gap-1.5 text-rose-800">
                <CheckCircle size={14} /> 5. Menggadaikan Properti (Mortgage)
              </h4>
              <p className="mt-1">
                Properti tanpa bangunan dapat digadaikan ke Bank untuk mendapatkan 50% nilai harga beli. Properti yang digadaikan tidak dapat menarik sewa. Untuk menebus gadai, bayar nilai gadai ditambah bunga 10%.
              </p>
            </div>

            <div>
              <h4 className="font-black text-stone-900 text-xs uppercase flex items-center gap-1.5 text-stone-800">
                <AlertTriangle size={14} className="text-amber-500" /> 6. Penjara
              </h4>
              <p className="mt-1">
                Anda masuk penjara jika mendarat di petak &apos;Masuk Penjara&apos;, mengambil kartu yang menyuruh masuk, atau melempar double 3x. Cara keluar: lempar dadu double (diberi 3x kesempatan), bayar denda $50, atau gunakan Kartu Bebas Penjara.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase rounded-xl cursor-pointer"
          >
            Tutup &amp; Lanjut Bermain
          </button>
        </div>
      </div>
    </div>
  );
};
