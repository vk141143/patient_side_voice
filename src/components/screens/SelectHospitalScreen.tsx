import { useState } from 'react';
import { ArrowLeft, Star, Users, Search, SlidersHorizontal, MapPin, Wallet, AlertCircle, Navigation } from 'lucide-react';
import { Hospital } from '@/types/app';
import { Button } from '@/components/ui/button';
import { WalletRechargeModal } from '@/components/WalletRechargeModal';

interface SelectHospitalScreenProps {
  onSelect: (hospital: Hospital) => void;
  onBack: () => void;
  walletBalance: number;
  onRecharge: (amount: number) => void;
}

const sampleHospitals = [
  { id: '1', name: 'City Care Hospital',  address: 'Sector 21, Gurugram',    distance: '1.2 km', rating: 4.8, availableDoctors: 12, opdFeeRange: '₹300 - ₹500', fee: 300, lat: 28.4595, lng: 77.0266 },
  { id: '2', name: 'Apollo Clinic',       address: 'DLF Phase 2, Gurugram',  distance: '2.5 km', rating: 4.9, availableDoctors: 8,  opdFeeRange: '₹500 - ₹800', fee: 500, lat: 28.4721, lng: 77.0937 },
  { id: '3', name: 'Max Healthcare',      address: 'Sector 19, Gurugram',    distance: '3.1 km', rating: 4.7, availableDoctors: 15, opdFeeRange: '₹400 - ₹700', fee: 400, lat: 28.4506, lng: 77.0152 },
  { id: '4', name: 'Fortis Memorial',     address: 'Sector 44, Gurugram',    distance: '4.8 km', rating: 4.9, availableDoctors: 20, opdFeeRange: '₹600 - ₹1000', fee: 600, lat: 28.4282, lng: 77.0478 },
];

type SortKey = 'rating' | 'price-low' | 'price-high';

export function SelectHospitalScreen({ onSelect, onBack, walletBalance, onRecharge }: SelectHospitalScreenProps) {
  const [selected, setSelected] = useState<(typeof sampleHospitals)[0] | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showWallet, setShowWallet] = useState(false);

  const filtered = sampleHospitals
    .filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.address.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'price-low') return a.fee - b.fee;
      if (sort === 'price-high') return b.fee - a.fee;
      return parseFloat(a.distance) - parseFloat(b.distance);
    });

  const openMaps = (h: typeof sampleHospitals[0]) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ' ' + h.address)}`, '_blank');
  };

  const canAfford = selected ? walletBalance >= selected.fee : false;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          {/* Wallet chip */}
          <button
            onClick={() => setShowWallet(true)}
            className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5"
          >
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">₹{walletBalance}</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Select Hospital</h1>
        <p className="text-muted-foreground mt-1">Choose a hospital or clinic near you</p>
      </div>

      {/* Search + Filter */}
      <div className="px-5 pb-3 space-y-3">
        <div className="flex items-center gap-2 h-12 px-4 rounded-xl border border-border bg-card focus-within:border-primary transition-colors">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search hospital or area..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border'}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
          {showFilters && (
            <>
              {([['rating', '⭐ Rating'], ['price-low', '₹ Low to High'], ['price-high', '₹ High to Low']] as [SortKey, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSort(sort === key ? null : key)}
                  className={`px-3 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${sort === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border'}`}
                >
                  {label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Hospital List */}
      <div className="flex-1 px-5 overflow-y-auto space-y-3 pb-4">
        {filtered.map((hospital) => {
          const affordable = walletBalance >= hospital.fee;
          const isSelected = selected?.id === hospital.id;

          return (
            <div
              key={hospital.id}
              onClick={() => setSelected(hospital)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground flex-1 pr-2">{hospital.name}</h3>
                <div className="flex items-center gap-1 bg-orange-400/10 px-2 py-1 rounded-full flex-shrink-0">
                  <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
                  <span className="text-xs font-semibold text-orange-500">{hospital.rating}</span>
                </div>
              </div>

              {/* Address + Maps button */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{hospital.address}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); openMaps(hospital); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors flex-shrink-0 ml-2"
                >
                  <Navigation className="w-3 h-3" />
                  Maps
                </button>
              </div>

              {/* Doctors + Fee + Wallet check */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{hospital.availableDoctors} doctors available</span>
                </div>
                <span className={`text-sm font-bold ${affordable ? 'text-foreground' : 'text-destructive'}`}>
                  ₹{hospital.fee}
                </span>
              </div>

              {/* Insufficient balance warning */}
              {isSelected && !affordable && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-xs text-destructive font-medium">
                      Insufficient balance. Need ₹{hospital.fee - walletBalance} more.
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowWallet(true); }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <Wallet className="w-4 h-4" />
                    Recharge Wallet
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="p-5 pb-8">
        <Button
          variant="default"
          size="xl"
          className="w-full"
          disabled={!selected || !canAfford}
          onClick={() => selected && canAfford && onSelect(selected as Hospital)}
        >
          Select Hospital
        </Button>
      </div>

      {showWallet && (
        <WalletRechargeModal
          currentBalance={walletBalance}
          onRecharge={onRecharge}
          onClose={() => setShowWallet(false)}
        />
      )}
    </div>
  );
}
