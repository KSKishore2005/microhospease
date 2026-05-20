import { Star, Gift } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Card from '../../components/common/Card';
import { guestsApi } from '../../api/guests';
import { useEffectiveGuestId } from '../../hooks/useEffectiveGuestId';

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

export default function LoyaltyPoints() {
  const { effectiveGuestId: guestId } = useEffectiveGuestId();

  const { data: guest } = useQuery({
    queryKey: ['guest', guestId],
    queryFn: () => guestId ? guestsApi.getById(guestId) : Promise.resolve(null),
    enabled: !!guestId,
  });

  const loyaltyTier   = guest?.loyaltyTier ?? 'BRONZE';
  const currentTier   = TIERS.find((t) => t.name === loyaltyTier) ?? TIERS[0];
  const nextTier      = TIERS[TIERS.findIndex((t) => t.name === loyaltyTier) + 1];
  // loyaltyPoints is not returned by the backend — derive a representative value from tier
  const loyaltyPoints = currentTier.demoPoints;
  const progress      = nextTier
    ? Math.min(100, ((loyaltyPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loyalty Points</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track your rewards and tier status</p>
      </div>

      {/* Points hero */}
      <div className="rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-navy-300 text-sm">Your Balance</p>
            <p className="text-4xl font-bold mt-1">{loyaltyPoints.toLocaleString()} <span className="text-xl text-navy-300">pts</span></p>
            <div className="flex items-center gap-2 mt-3">
              <Star size={14} className="text-gold-400" />
              <span className="text-gold-400 font-semibold">{loyaltyTier} Member</span>
              <span className="text-navy-400 text-sm">• {currentTier.multiplier} points multiplier</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-xs text-navy-300 mb-1">Member Name</p>
            <p className="text-lg font-bold">{guest?.name ?? '—'}</p>
          </div>
        </div>

        {nextTier && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-navy-300 mb-1.5">
              <span>{currentTier.name}</span>
              <span>{(nextTier.min - loyaltyPoints).toLocaleString()} pts to {nextTier.name}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full">
              <div className="h-2 bg-gold-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Tier overview */}
      <Card title="Membership Tiers">
        <div className="grid sm:grid-cols-4 gap-3">
          {TIERS.map((tier) => {
            const isCurrent = tier.name === loyaltyTier;
            return (
              <div key={tier.name} className={`p-4 rounded-xl border-2 transition-all ${isCurrent ? 'border-gold-400 shadow-md shadow-gold-100' : 'border-gray-100'}`}>
                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2 ${tier.color}`}>{tier.name}</div>
                <p className="text-xs text-gray-500">{tier.min.toLocaleString()} – {tier.max.toLocaleString()} pts</p>
                <p className="text-sm font-bold text-navy-800 mt-1">{tier.multiplier} earn rate</p>
                {isCurrent && <p className="text-xs text-gold-600 font-medium mt-1">✓ Current tier</p>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Rewards catalog */}
      <Card title="Rewards Catalog" subtitle="Redeem your points for exclusive experiences">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REWARDS.map((reward) => {
            const canRedeem = loyaltyPoints >= reward.points;
            return (
              <div key={reward.name} className={`p-4 rounded-xl border transition-all ${canRedeem ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-100 bg-gray-50/50 opacity-70'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{reward.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{reward.category}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Value: {reward.value}</p>
                  </div>
                  <Gift size={16} className={canRedeem ? 'text-emerald-600' : 'text-gray-400'} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold text-navy-800">{reward.points.toLocaleString()} pts</span>
                  <button disabled={!canRedeem}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${canRedeem ? 'bg-navy-900 text-white hover:bg-navy-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    Redeem
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
