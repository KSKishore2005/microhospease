import { useState, useEffect } from 'react';
import { Star, Gift, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import { guestsApi } from '../../api/guests';
import { useEffectiveGuestId } from '../../hooks/useEffectiveGuestId';
import { useToastStore } from '../../store/toastStore';
import { formatRelative } from '../../utils/formatters';

const TIERS = [
  { name: 'BRONZE',   min: 0,     max: 5000,   color: 'text-amber-600 bg-amber-50',  bar: 'bg-amber-400',  multiplier: '1x',  demoPoints: 2500  },
  { name: 'SILVER',   min: 5000,  max: 15000,  color: 'text-gray-600 bg-gray-100',   bar: 'bg-gray-400',   multiplier: '1.5x',demoPoints: 9500  },
  { name: 'GOLD',     min: 15000, max: 30000,  color: 'text-yellow-600 bg-yellow-50',bar: 'bg-yellow-400', multiplier: '2x',  demoPoints: 22500 },
  { name: 'PLATINUM', min: 30000, max: 100000, color: 'text-purple-700 bg-purple-50', bar: 'bg-purple-500', multiplier: '3x',  demoPoints: 45000 },
];

const REWARDS = [
  { name: 'Free Breakfast',      points: 500,  value: '$45',   category: 'Dining'         },
  { name: 'Spa Credit ($50)',    points: 1000, value: '$50',   category: 'Wellness'       },
  { name: 'Room Upgrade',        points: 2500, value: '$150',  category: 'Accommodation'  },
  { name: 'Airport Transfer',    points: 1500, value: '$80',   category: 'Transport'      },
  { name: 'Free Night Stay',     points: 8000, value: '$250+', category: 'Accommodation'  },
  { name: 'Fine Dining (2 pax)', points: 3000, value: '$200',  category: 'Dining'         },
];

interface RedemptionRecord {
  name: string;
  points: number;
  redeemedAt: string;
}

export default function LoyaltyPoints() {
  const { effectiveGuestId: guestId } = useEffectiveGuestId();
  const [points, setPoints] = useState<number | null>(null);
  const [history, setHistory] = useState<RedemptionRecord[]>([]);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  
  const addToast = useToastStore((s) => s.addToast);

  const { data: guest } = useQuery({
    queryKey: ['guest', guestId],
    queryFn: () => guestId ? guestsApi.getById(guestId) : Promise.resolve(null),
    enabled: !!guestId,
  });

  const loyaltyTier = guest?.loyaltyTier ?? 'BRONZE';
  const currentTier = TIERS.find((t) => t.name === loyaltyTier) ?? TIERS[0];
  const nextTier = TIERS[TIERS.findIndex((t) => t.name === loyaltyTier) + 1];

  // Initialize and load points and redemption history
  useEffect(() => {
    if (guestId) {
      setLoadingPoints(true);
      const timer = setTimeout(() => {
        // Load points balance
        const savedPoints = localStorage.getItem(`hospease-loyalty-points-${guestId}`);
        if (savedPoints !== null) {
          setPoints(Number(savedPoints));
        } else {
          setPoints(currentTier.demoPoints);
          localStorage.setItem(`hospease-loyalty-points-${guestId}`, String(currentTier.demoPoints));
        }

        // Load redemption history
        const savedHistory = localStorage.getItem(`hospease-loyalty-history-${guestId}`);
        setHistory(savedHistory ? JSON.parse(savedHistory) : []);
        setLoadingPoints(false);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [guestId, currentTier]);

  const handleRedeem = (reward: (typeof REWARDS)[0]) => {
    if (points === null || points < reward.points) {
      addToast('Insufficient points balance!', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to redeem "${reward.name}" for ${reward.points} points?`)) {
      return;
    }

    setRedeeming(reward.name);

    // Simulate mutation delay
    setTimeout(() => {
      const newPoints = points - reward.points;
      setPoints(newPoints);
      localStorage.setItem(`hospease-loyalty-points-${guestId}`, String(newPoints));

      const newRecord: RedemptionRecord = {
        name: reward.name,
        points: reward.points,
        redeemedAt: new Date().toISOString(),
      };

      const updatedHistory = [newRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem(`hospease-loyalty-history-${guestId}`, JSON.stringify(updatedHistory));

      setRedeeming(null);
      addToast(`Successfully redeemed "${reward.name}"! Check your email/dashboard.`, 'success');
    }, 800);
  };

  const currentPoints = points ?? 0;
  const progress = nextTier
    ? Math.min(100, ((currentPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loyalty Points</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track your rewards and tier status</p>
      </div>

      {/* Points hero */}
      {loadingPoints ? (
        <div className="h-[180px] w-full rounded-2xl bg-gray-200 animate-pulse" />
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-6 text-white shadow-lg animate-fade-in-up">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-navy-300 text-sm">Your Balance</p>
              <p className="text-4xl font-bold mt-1">{currentPoints.toLocaleString()} <span className="text-xl text-navy-300">pts</span></p>
              <div className="flex items-center gap-2 mt-3">
                <Star size={14} className="text-gold-400 fill-gold-400" />
                <span className="text-gold-400 font-semibold">{loyaltyTier} Member</span>
                <span className="text-navy-400 text-sm">• {currentTier.multiplier} points multiplier</span>
              </div>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-navy-300 mb-1">Member Name</p>
              <p className="text-lg font-bold">{guest?.name ?? '—'}</p>
            </div>
          </div>

          {nextTier && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-navy-300 mb-1.5">
                <span>{currentTier.name}</span>
                <span>{Math.max(0, nextTier.min - currentPoints).toLocaleString()} pts to {nextTier.name}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full">
                <div className="h-2 bg-gold-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Side: Membership Tiers & Redemption History */}
        <div className="md:col-span-1 space-y-6">
          <Card title="Membership Tiers" padding={true}>
            <div className="flex flex-col gap-3">
              {TIERS.map((tier) => {
                const isCurrent = tier.name === loyaltyTier;
                return (
                  <div key={tier.name} className={`p-3 rounded-xl border transition-all ${isCurrent ? 'border-gold-400 bg-gold-50/20 shadow-xs' : 'border-gray-100 bg-white'}`}>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${tier.color}`}>{tier.name}</div>
                    <p className="text-xs text-gray-500">{tier.min.toLocaleString()} – {tier.max.toLocaleString()} pts</p>
                    <p className="text-xs font-bold text-navy-800 mt-1">{tier.multiplier} earn multiplier</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Redemption History" padding={true}>
            <div className="divide-y divide-gray-100 max-h-[250px] overflow-y-auto pr-1">
              {history.map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5"><Clock size={10} />{formatRelative(item.redeemedAt)}</div>
                  </div>
                  <span className="font-bold text-rose-600">-{item.points} pts</span>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-xs">No rewards redeemed yet.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Rewards Catalog */}
        <div className="md:col-span-2">
          <Card title="Rewards Catalog" subtitle="Redeem your points for exclusive experiences">
            {loadingPoints ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {REWARDS.map((reward) => {
                  const canRedeem = currentPoints >= reward.points;
                  const isRedeeming = redeeming === reward.name;
                  return (
                    <div key={reward.name} className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 ${canRedeem ? 'border-emerald-200 bg-white hover:shadow-md' : 'border-gray-100 bg-gray-50/50 opacity-60'}`}>
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-sm text-slate-800">{reward.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{reward.category} · Value {reward.value}</p>
                          </div>
                          <Gift size={16} className={canRedeem ? 'text-emerald-600' : 'text-gray-400'} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm font-bold text-navy-800">{reward.points.toLocaleString()} pts</span>
                        <button
                          disabled={!canRedeem || isRedeeming}
                          onClick={() => handleRedeem(reward)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${canRedeem ? 'bg-slate-900 text-amber-400 hover:bg-slate-800 hover:scale-102' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                          {isRedeeming ? 'Redeeming...' : 'Redeem'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
